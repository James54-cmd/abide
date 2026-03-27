import { getAccessToken } from "@/lib/supabase";

export async function requestEmailChangeOtp(newEmail: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Session expired. Please sign in again.");
  }

  const response = await fetch("/api/auth/request-email-change-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newEmail: newEmail.trim().toLowerCase() }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      retryAfterSeconds?: number;
    };
    if (response.status === 429 && typeof body.retryAfterSeconds === "number") {
      throw new Error(`Please wait ${body.retryAfterSeconds}s before requesting another code.`);
    }
    throw new Error(body.error ?? "Could not send OTP.");
  }
}

export async function verifyEmailChangeOtp(otp: string): Promise<{ email: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Session expired. Please sign in again.");
  }

  const response = await fetch("/api/auth/verify-email-change-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ otp: otp.trim() }),
  });

  const body = (await response.json().catch(() => ({}))) as { error?: string; email?: string };
  if (!response.ok || !body.email) {
    throw new Error(body.error ?? "Could not verify OTP.");
  }
  return { email: body.email };
}
