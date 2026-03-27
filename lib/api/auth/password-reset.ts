export async function requestPasswordResetEmail(email: string): Promise<void> {
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
        `Please wait before requesting another reset email. Try again in about ${body.retryAfterSeconds} seconds.`
      );
    }
    throw new Error(body.error ?? "Could not send reset email. Please try again.");
  }
}

export async function completePasswordReset(token: string, password: string): Promise<void> {
  const response = await fetch("/api/auth/complete-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Could not reset password. Please try again.");
  }
}
