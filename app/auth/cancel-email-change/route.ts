import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const POST_CANCEL_COOLDOWN_SECONDS = 60;

export async function GET(request: NextRequest) {
  const failedUrl = (reason: string) =>
    new URL(`/cancel-email-change/failed?reason=${encodeURIComponent(reason)}`, request.url);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.redirect(failedUrl("Server configuration error."));
  }

  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.redirect(failedUrl("Invalid cancellation link."));
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);
  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("id, email_change_cancel_expires_at")
    .eq("email_change_cancel_token", token)
    .single();

  if (error || !profile) {
    return NextResponse.redirect(failedUrl("Invalid or expired cancellation link."));
  }

  const expiresAt = profile.email_change_cancel_expires_at
    ? new Date(profile.email_change_cancel_expires_at).getTime()
    : null;
  if (!expiresAt || !Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return NextResponse.redirect(failedUrl("Cancellation link expired."));
  }

  await adminClient
    .from("profiles")
    .update({
      email_change_pending: null,
      email_change_otp: null,
      email_change_otp_expires_at: null,
      email_change_otp_last_sent_at: new Date().toISOString(),
      email_change_cancel_token: null,
      email_change_cancel_expires_at: null,
    })
    .eq("id", profile.id);

  return NextResponse.redirect(
    new URL(
      `/cancel-email-change/success?cooldown=${POST_CANCEL_COOLDOWN_SECONDS}`,
      request.url
    )
  );
}
