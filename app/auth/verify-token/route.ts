import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=Invalid link", request.url));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.redirect(new URL("/login?error=Server configuration error", request.url));
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Find profile by token
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, email, verification_token_expires_at")
    .eq("verification_token", token)
    .single();

  if (profileError || !profile) {
    return NextResponse.redirect(new URL("/login?error=Invalid or expired verification link", request.url));
  }

  const expiresAt = profile.verification_token_expires_at
    ? new Date(profile.verification_token_expires_at).getTime()
    : null;
  if (expiresAt && Number.isFinite(expiresAt) && expiresAt < Date.now()) {
    await adminClient
      .from("profiles")
      .update({
        verification_status: "expired",
        verification_token: null,
      })
      .eq("id", profile.id);
    return NextResponse.redirect(
      new URL(`/resend_verification?email=${encodeURIComponent(profile.email)}`, request.url)
    );
  }

  // 2. Mark as verified in profiles
  const { error: updateError } = await adminClient
    .from("profiles")
    .update({ 
      verification_status: "verified",
      verification_token: null,
      verification_token_expires_at: null,
    })
    .eq("id", profile.id);

  if (updateError) {
    return NextResponse.redirect(new URL("/login?error=Failed to verify account", request.url));
  }

  // 3. Mark as confirmed in auth.users for Supabase Auth compatibility
  await adminClient.auth.admin.updateUserById(profile.id, {
    email_confirm: true
  });

  // 4. Redirect to verification success page
  return NextResponse.redirect(new URL("/verify/success", request.url));
}
