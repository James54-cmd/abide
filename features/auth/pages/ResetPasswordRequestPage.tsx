"use client";

import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordRequestCard from "@/features/auth/components/ResetPasswordRequestCard";
import { useResetPasswordRequestState } from "@/features/auth/hooks/useResetPasswordRequestState";

export default function ResetPasswordRequestPage() {
  const state = useResetPasswordRequestState();

  return (
    <AuthShell>
      <div className="w-full space-y-4">
        <ResetPasswordRequestCard
          email={state.email}
          otp={state.otp}
          newPassword={state.newPassword}
          confirmPassword={state.confirmPassword}
          isOtpSent={state.isOtpSent}
          isOtpModalOpen={state.isOtpModalOpen}
          message={state.message}
          error={state.error}
          isSendingOtp={state.isSendingOtp}
          isResettingPassword={state.isResettingPassword}
          canResendOtp={state.canResendOtp}
          otpResendCountdownLabel={state.otpResendCountdownLabel}
          onEmailChange={state.setEmail}
          onOtpChange={state.setOtp}
          onNewPasswordChange={state.setNewPassword}
          onConfirmPasswordChange={state.setConfirmPassword}
          onSendOtp={() => void state.sendOtp()}
          onOpenOtpModal={() => state.setIsOtpModalOpen(true)}
          onCloseOtpModal={() => state.setIsOtpModalOpen(false)}
          onResetPassword={() => void state.resetPassword()}
        />
        <p className="text-center">
          <Link
            href="/login"
            className="text-xs font-medium text-gold hover:text-gold/80 transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
