"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { completePasswordReset } from "@/lib/api/auth/password-reset";

export function useResetPasswordConfirmState(token: string | null) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(async () => {
    if (!token) {
      setError("This reset link is missing a token. Please use the link from your email.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);
      setError(null);
      await completePasswordReset(token, newPassword);
      setMessage("Password updated. Taking you to sign in...");
      setTimeout(() => {
        router.replace("/login?message=Password%20updated.%20Please%20log%20in.");
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setIsSubmitting(false);
    }
  }, [token, newPassword, confirmPassword, router]);

  return {
    newPassword,
    confirmPassword,
    message,
    error,
    isSubmitting,
    setNewPassword,
    setConfirmPassword,
    submit,
  };
}
