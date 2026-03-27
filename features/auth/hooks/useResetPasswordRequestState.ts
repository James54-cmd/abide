"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { completePasswordReset, requestPasswordResetOtp } from "@/lib/api/auth/password-reset";
import { formatCountdown } from "@/lib/utils";

const OTP_RESEND_COOLDOWN_SECONDS = 60;

export function useResetPasswordRequestState() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [otpResendCooldownSeconds, setOtpResendCooldownSeconds] = useState(0);
  const canResendOtp = otpResendCooldownSeconds <= 0;
  const otpResendCountdownLabel = formatCountdown(otpResendCooldownSeconds);

  useEffect(() => {
    if (otpResendCooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setOtpResendCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpResendCooldownSeconds]);

  const sendOtp = useCallback(async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError("Please enter your email address.");
      return;
    }
    if (isOtpSent && !canResendOtp) {
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
      setIsSendingOtp(true);
      setMessage(null);
      setError(null);
      await requestPasswordResetOtp(normalized);
      setIsOtpSent(true);
      setIsOtpModalOpen(true);
      setOtpResendCooldownSeconds(OTP_RESEND_COOLDOWN_SECONDS);
      setMessage("If an account exists for that email, we sent a 6-digit reset code.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
      const retryMatch = msg.match(/(\d+)\s*seconds?/i);
      if (retryMatch) {
        const retrySeconds = Number(retryMatch[1]);
        if (Number.isFinite(retrySeconds) && retrySeconds > 0) {
          setOtpResendCooldownSeconds(retrySeconds);
        }
      }
    } finally {
      setIsSendingOtp(false);
    }
  }, [email, newPassword, confirmPassword, isOtpSent, canResendOtp]);

  const resetPassword = useCallback(async () => {
    const normalized = email.trim().toLowerCase();
    const normalizedOtp = otp.replace(/\D+/g, "").trim();
    if (!normalized) {
      setError("Please enter your email address.");
      return;
    }
    if (!normalizedOtp || normalizedOtp.length !== 6) {
      setError("Please enter the 6-digit reset code.");
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
      setIsResettingPassword(true);
      setMessage(null);
      setError(null);
      await completePasswordReset(normalized, normalizedOtp, newPassword);
      setIsOtpModalOpen(false);
      router.replace("/reset-password/success");
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      if (msg.includes("expired")) {
        router.replace("/reset-password/failed?reason=expired");
        return;
      }
      if (msg.includes("incorrect") || msg.includes("invalid")) {
        router.replace("/reset-password/failed?reason=invalid");
        return;
      }
      router.replace("/reset-password/failed?reason=unknown");
    } finally {
      setIsResettingPassword(false);
    }
  }, [email, otp, newPassword, confirmPassword, router]);

  return {
    email,
    otp,
    newPassword,
    confirmPassword,
    isOtpSent,
    isOtpModalOpen,
    message,
    error,
    isSendingOtp,
    isResettingPassword,
    canResendOtp,
    otpResendCountdownLabel,
    setEmail,
    setOtp,
    setNewPassword,
    setConfirmPassword,
    setIsOtpModalOpen,
    sendOtp,
    resetPassword,
  };
}
