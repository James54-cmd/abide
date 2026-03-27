"use client";

import OtpModal from "@/components/ui/otp-modal";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type Props = {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
  isOtpSent: boolean;
  isOtpModalOpen: boolean;
  message: string | null;
  error: string | null;
  isSendingOtp: boolean;
  isResettingPassword: boolean;
  canResendOtp: boolean;
  otpResendCountdownLabel: string;
  onEmailChange: (value: string) => void;
  onOtpChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSendOtp: () => void;
  onOpenOtpModal: () => void;
  onCloseOtpModal: () => void;
  onResetPassword: () => void;
};

export default function ResetPasswordRequestCard({
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
  onEmailChange,
  onOtpChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSendOtp,
  onOpenOtpModal,
  onCloseOtpModal,
  onResetPassword,
}: Props) {
  const isBusy = isSendingOtp || isResettingPassword;
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="w-full rounded-3xl border border-gold/10 bg-white/70 dark:bg-dark-card/70 backdrop-blur-sm p-4 sm:p-5 space-y-4 shadow-warm">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-serif font-semibold text-ink dark:text-parchment">
          Reset password
        </h2>
        <p className="text-sm text-muted">
          Enter your email and new password. We will send a 6-digit code to confirm.
        </p>
      </div>

      <input
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="you@example.com"
        disabled={isBusy || isOtpSent}
        className="w-full bg-white dark:bg-dark-card border border-gold/10 rounded-full px-4 py-3.5 text-sm text-ink dark:text-parchment placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60"
      />
      <div className="relative">
        <input
          type={showNewPassword ? "text" : "password"}
          value={newPassword}
          onChange={(e) => onNewPasswordChange(e.target.value)}
          placeholder="New password"
          disabled={isBusy || isOtpSent}
          className="w-full bg-white dark:bg-dark-card border border-gold/10 rounded-full px-4 py-3.5 pr-11 text-sm text-ink dark:text-parchment placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => setShowNewPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink dark:hover:text-parchment"
          aria-label={showNewPassword ? "Hide password" : "Show password"}
        >
          {showNewPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>
      <div className="relative">
        <input
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          placeholder="Confirm new password"
          disabled={isBusy || isOtpSent}
          className="w-full bg-white dark:bg-dark-card border border-gold/10 rounded-full px-4 py-3.5 pr-11 text-sm text-ink dark:text-parchment placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink dark:hover:text-parchment"
          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
        >
          {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>

      {!isOtpSent ? (
        <button
          type="button"
          onClick={onSendOtp}
          disabled={isBusy}
          className="w-full bg-gold text-white rounded-full py-3.5 text-sm font-semibold shadow-warm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSendingOtp ? "Saving..." : "Save and send OTP"}
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={onOpenOtpModal}
            disabled={isBusy}
            className="w-full bg-gold text-white rounded-full py-3.5 text-sm font-semibold shadow-warm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Enter code and update password
          </button>
        </>
      )}

      {message ? (
        <p className="text-xs text-green-700 text-center rounded-2xl bg-green-50 px-3 py-2 border border-green-100">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-red-600 text-center rounded-2xl bg-red-50 px-3 py-2 border border-red-100">
          {error}
        </p>
      ) : null}

      <OtpModal
        open={isOtpModalOpen}
        onOpenChange={(open) => (open ? onOpenOtpModal() : onCloseOtpModal())}
        title="Confirm password reset"
        description="Enter the 6-digit code sent to your email to finish."
        otpValue={otp}
        onOtpChange={onOtpChange}
        onConfirm={onResetPassword}
        onResend={onSendOtp}
        isConfirming={isResettingPassword}
        isResending={isSendingOtp}
        canResend={canResendOtp}
        resendLabel={
          isSendingOtp ? "Sending..." : canResendOtp ? "Send code again" : `Send again in ${otpResendCountdownLabel}`
        }
        helperText="For security, this code expires quickly."
      />
    </div>
  );
}
