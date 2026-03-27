export async function requestPasswordResetOtp(email: string): Promise<void> {
  const response = await fetch("/api/auth/request-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      retryAfterSeconds?: number;
    };
    if (response.status === 429 && typeof body.retryAfterSeconds === "number") {
      throw new Error(
        `Please wait before requesting another reset code. Try again in about ${body.retryAfterSeconds} seconds.`
      );
    }
    throw new Error(body.error ?? "Could not send reset code. Please try again.");
  }
}

export async function completePasswordReset(email: string, otp: string, password: string): Promise<void> {
  const response = await fetch("/api/auth/complete-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim(), password }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
    const err = new Error(body.error ?? "Could not reset password. Please try again.") as Error & {
      code?: string;
    };
    if (typeof body.code === "string") {
      err.code = body.code;
    }
    throw err;
  }
}

export function getPasswordResetCompletionErrorCode(error: unknown): string | undefined {
  if (error instanceof Error && typeof (error as Error & { code?: string }).code === "string") {
    return (error as Error & { code: string }).code;
  }
  return undefined;
}
