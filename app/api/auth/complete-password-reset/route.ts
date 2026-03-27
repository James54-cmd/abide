import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type Body = {
  token?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Something went wrong on our end. Please try again later." }, { status: 500 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = body.token?.trim();
  const password = body.password?.trim();
  if (!token) {
    return NextResponse.json({ error: "This reset link is invalid or incomplete." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: profile, error: findError } = await adminClient
    .from("profiles")
    .select("id, password_reset_expires_at")
    .eq("password_reset_token", token)
    .single();

  if (findError || !profile) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Please request a new one." },
      { status: 400 }
    );
  }

  const expiresAt = profile.password_reset_expires_at
    ? new Date(profile.password_reset_expires_at).getTime()
    : null;
  if (expiresAt && Number.isFinite(expiresAt) && expiresAt < Date.now()) {
    await adminClient
      .from("profiles")
      .update({
        password_reset_token: null,
        password_reset_expires_at: null,
      })
      .eq("id", profile.id);
    return NextResponse.json(
      { error: "This reset link has expired. Please request a new password reset." },
      { status: 400 }
    );
  }

  const { error: authError } = await adminClient.auth.admin.updateUserById(profile.id, {
    password,
  });

  if (authError) {
    return NextResponse.json({ error: "Could not update your password. Please try again." }, { status: 400 });
  }

  await adminClient
    .from("profiles")
    .update({
      password_reset_token: null,
      password_reset_expires_at: null,
    })
    .eq("id", profile.id);

  return NextResponse.json({ success: true });
}
