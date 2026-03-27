import { NextRequest, NextResponse } from "next/server";
import { requireUserFromAuthHeader } from "@/lib/server/supabase-admin";
import { sendEmailChangeNoticeToOldEmail, sendEmailChangeOtpEmail } from "@/lib/server/email";

const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const CANCEL_TTL_MS = 30 * 60 * 1000;

type Body = {
  newEmail?: string;
};

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { user, supabase } = await requireUserFromAuthHeader(authHeader);

    const body = (await request.json()) as Body;
    const newEmail = body.newEmail?.trim().toLowerCase();
    if (!newEmail) {
      return NextResponse.json({ error: "Please enter your new email." }, { status: 400 });
    }
    if (newEmail === (user.email ?? "").trim().toLowerCase()) {
      return NextResponse.json({ error: "Please use a different email." }, { status: 400 });
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", newEmail)
      .maybeSingle();
    if (existingProfile) {
      return NextResponse.json({ error: "This email is already in use." }, { status: 409 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email_change_otp_last_sent_at")
      .eq("id", user.id)
      .single();

    const lastSentAt = profile?.email_change_otp_last_sent_at
      ? new Date(profile.email_change_otp_last_sent_at).getTime()
      : null;
    const now = Date.now();
    if (lastSentAt && Number.isFinite(lastSentAt)) {
      const nextAllowed = lastSentAt + OTP_COOLDOWN_MS;
      if (nextAllowed > now) {
        const retryAfterSeconds = Math.ceil((nextAllowed - now) / 1000);
        return NextResponse.json(
          { error: "Please wait before requesting another OTP.", retryAfterSeconds },
          { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        );
      }
    }

    const otp = generateOtp();
    const expiresAt = new Date(now + OTP_TTL_MS).toISOString();
    const cancelToken = crypto.randomUUID();
    const cancelExpiresAt = new Date(now + CANCEL_TTL_MS).toISOString();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const cancelLink = `${siteUrl}/auth/cancel-email-change?token=${encodeURIComponent(cancelToken)}`;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        email_change_pending: newEmail,
        email_change_otp: otp,
        email_change_otp_expires_at: expiresAt,
        email_change_otp_last_sent_at: new Date(now).toISOString(),
        email_change_cancel_token: cancelToken,
        email_change_cancel_expires_at: cancelExpiresAt,
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Could not prepare OTP. Please try again." }, { status: 500 });
    }

    await sendEmailChangeOtpEmail(newEmail, otp, profile?.full_name ?? undefined);
    if (user.email) {
      await sendEmailChangeNoticeToOldEmail(
        user.email,
        newEmail,
        cancelLink,
        profile?.full_name ?? undefined
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized.";
    const isUnauthorized = message === "Unauthorized." || message.includes("bearer");
    return NextResponse.json(
      { error: isUnauthorized ? "Please sign in again." : "Something went wrong. Please try again." },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
