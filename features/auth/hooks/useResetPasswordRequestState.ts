"use client";

import { useState, useCallback } from "react";
import { requestPasswordResetEmail } from "@/lib/api/auth/password-reset";

export function useResetPasswordRequestState() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);
      setError(null);
      await requestPasswordResetEmail(normalized);
      setMessage("If an account exists for that email, we sent a link to reset your password.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [email]);

  return { email, setEmail, message, error, isSubmitting, submit };
}
