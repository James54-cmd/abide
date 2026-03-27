import { NextRequest, NextResponse } from "next/server";
import { requireUserFromAuthHeader } from "@/lib/server/supabase-admin";

type Body = {
  otp?: string;
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const { user, supabase } = await requireUserFromAuthHeader(authHeader);

    const body = (await request.json()) as Body;
    const otp = body.otp?.trim();
    if (!otp) {
      return NextResponse.json({ error: "Please enter the OTP." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email_change_pending, email_change_otp, email_change_otp_expires_at")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Could not verify OTP." }, { status: 400 });
    }

    if (!profile.email_change_pending || !profile.email_change_otp || !profile.email_change_otp_expires_at) {
      return NextResponse.json({ error: "No pending email change found." }, { status: 400 });
    }

    const expiresAt = new Date(profile.email_change_otp_expires_at).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      return NextResponse.json({ error: "OTP expired. Please request a new code." }, { status: 400 });
    }

    if (profile.email_change_otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP code." }, { status: 400 });
    }

    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(user.id, {
      email: profile.email_change_pending,
      email_confirm: true,
    });
    if (authUpdateError) {
      return NextResponse.json({ error: "Could not update email. Please try again." }, { status: 400 });
    }

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        email: profile.email_change_pending,
        email_change_pending: null,
        email_change_otp: null,
        email_change_otp_expires_at: null,
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      return NextResponse.json({ error: "Email updated in auth, but profile sync failed." }, { status: 500 });
    }

    return NextResponse.json({ success: true, email: profile.email_change_pending });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized.";
    const isUnauthorized = message === "Unauthorized." || message.includes("bearer");
    return NextResponse.json(
      { error: isUnauthorized ? "Please sign in again." : "Something went wrong. Please try again." },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
