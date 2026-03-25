import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/server/email";

const RESEND_COOLDOWN_MS = 2 * 60 * 1000;
const VERIFICATION_TOKEN_TTL_MS = 2 * 60 * 1000;

type ResendRequestBody = {
  email?: string;
};

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  let body: ResendRequestBody;
  try {
    body = (await request.json()) as ResendRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, email, full_name, verification_status, verification_last_resent_at")
    .eq("email", email)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (profile.verification_status === "verified") {
    return NextResponse.json({ error: "Account is already verified." }, { status: 400 });
  }

  const lastResentAt = profile.verification_last_resent_at
    ? new Date(profile.verification_last_resent_at).getTime()
    : null;
  const now = Date.now();
  if (lastResentAt && Number.isFinite(lastResentAt)) {
    const nextAllowedAt = lastResentAt + RESEND_COOLDOWN_MS;
    if (nextAllowedAt > now) {
      const retryAfterSeconds = Math.ceil((nextAllowedAt - now) / 1000);
      return NextResponse.json(
        {
          error: "Please wait before requesting another verification email.",
          retryAfterSeconds,
        },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }
  }

  const verificationToken = crypto.randomUUID();
  const verificationTokenExpiresAt = new Date(now + VERIFICATION_TOKEN_TTL_MS).toISOString();
  const verificationLink = `${siteUrl}/auth/verify-token?token=${verificationToken}`;

  const { error: updateError } = await adminClient
    .from("profiles")
    .update({
      verification_token: verificationToken,
      verification_status: "pending",
      verification_token_expires_at: verificationTokenExpiresAt,
      verification_last_resent_at: new Date(now).toISOString(),
    })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to prepare verification email." }, { status: 500 });
  }

  await sendVerificationEmail(email, verificationLink, profile.full_name ?? undefined);
  return NextResponse.json({ success: true });
}
