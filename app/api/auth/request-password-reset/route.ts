import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/lib/server/email";

const RESET_COOLDOWN_MS = 2 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

type Body = {
  email?: string;
};

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Something went wrong on our end. Please try again later." }, { status: 500 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Please enter your email address." }, { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, email, full_name, password_reset_last_sent_at")
    .eq("email", email)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ success: true });
  }

  const lastSent = profile.password_reset_last_sent_at
    ? new Date(profile.password_reset_last_sent_at).getTime()
    : null;
  const now = Date.now();
  if (lastSent && Number.isFinite(lastSent)) {
    const nextAllowed = lastSent + RESET_COOLDOWN_MS;
    if (nextAllowed > now) {
      const retryAfterSeconds = Math.ceil((nextAllowed - now) / 1000);
      return NextResponse.json(
        {
          error: `Please wait a moment before requesting another reset email.`,
          retryAfterSeconds,
        },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(now + RESET_TOKEN_TTL_MS).toISOString();
  const resetLink = `${siteUrl}/reset_password?token=${encodeURIComponent(token)}`;

  const { error: updateError } = await adminClient
    .from("profiles")
    .update({
      password_reset_token: token,
      password_reset_expires_at: expiresAt,
      password_reset_last_sent_at: new Date(now).toISOString(),
    })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.json({ error: "Could not prepare your reset link. Please try again." }, { status: 500 });
  }

  await sendPasswordResetEmail(email, resetLink, profile.full_name ?? undefined);
  return NextResponse.json({ success: true });
}
