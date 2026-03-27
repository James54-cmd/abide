"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function useResetPasswordConfirmState(token: string | null) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(async () => {
    setMessage(null);
    setError("Password reset now uses OTP. Please request a reset code first.");
    setTimeout(() => {
      router.replace("/reset-password");
    }, 700);
  }, [router]);

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
