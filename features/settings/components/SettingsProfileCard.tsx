"use client";

import type { SettingsProfile } from "@/features/settings/types";
import OtpModal from "@/components/ui/otp-modal";

type Props = {
  profile: SettingsProfile;
  newEmail: string;
  emailOtp: string;
  isLoading: boolean;
  isSavingProfile: boolean;
  isEditingProfile: boolean;
  isSendingEmailOtp: boolean;
  isVerifyingEmailOtp: boolean;
  isEmailOtpSent: boolean;
  isOtpModalOpen: boolean;
  emailOtpInvalidToken: number;
  canResendEmailOtp: boolean;
  otpResendCountdownLabel: string;
  onFullNameChange: (value: string) => void;
  onNewEmailChange: (value: string) => void;
  onEmailOtpChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSendEmailOtp: () => void;
  onOpenOtpModal: () => void;
  onCloseOtpModal: () => void;
  onVerifyEmailOtp: () => void;
  onSaveProfile: () => void;
};

export default function SettingsProfileCard({
  profile,
  newEmail,
  emailOtp,
  isLoading,
  isSavingProfile,
  isEditingProfile,
  isSendingEmailOtp,
  isVerifyingEmailOtp,
  isEmailOtpSent,
  isOtpModalOpen,
  emailOtpInvalidToken,
  canResendEmailOtp,
  otpResendCountdownLabel,
  onFullNameChange,
  onNewEmailChange,
  onEmailOtpChange,
  onStartEdit,
  onCancelEdit,
  onSendEmailOtp,
  onOpenOtpModal,
  onCloseOtpModal,
  onVerifyEmailOtp,
  onSaveProfile,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs text-muted">Current email</label>
        <input
          type="email"
          value={profile.email}
          disabled
          className="w-full rounded-xl border border-gold/10 bg-gold/5 px-3 py-2 text-sm text-muted"
        />
      </div>

      {isEditingProfile ? (
        <div className="space-y-2 rounded-xl border border-gold/10 p-3">
          <label className="text-xs text-muted">New email</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(event) => onNewEmailChange(event.target.value)}
              placeholder="new@email.com"
              className="flex-1 rounded-xl border border-gold/10 bg-transparent px-3 py-2 text-sm text-ink dark:text-parchment focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <button
              type="button"
              onClick={onSendEmailOtp}
                disabled={isSendingEmailOtp || isSavingProfile || !canResendEmailOtp}
              className="rounded-full border border-gold/20 px-3 py-2 text-xs font-semibold text-ink dark:text-parchment disabled:opacity-60"
            >
                {isSendingEmailOtp
                  ? "Sending..."
                  : canResendEmailOtp
                    ? "Send OTP"
                    : `Retry in ${otpResendCountdownLabel}`}
            </button>
          </div>

          {isEmailOtpSent ? (
            <button
              type="button"
              onClick={onOpenOtpModal}
              className="w-full rounded-full border border-gold/20 px-4 py-2.5 text-sm font-semibold text-ink dark:text-parchment"
            >
              Enter verification code
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-1">
        <label className="text-xs text-muted">Display name</label>
        <input
          type="text"
          value={profile.fullName}
          onChange={(event) => onFullNameChange(event.target.value)}
          placeholder="Your name"
          disabled={isLoading || !isEditingProfile}
          className="w-full rounded-xl border border-gold/10 bg-transparent px-3 py-2 text-sm text-ink dark:text-parchment focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
      </div>

      {isEditingProfile ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={isSavingProfile}
            className="flex-1 rounded-full border border-gold/20 px-4 py-2.5 text-sm font-semibold text-ink dark:text-parchment disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSaveProfile}
            disabled={isLoading || isSavingProfile}
            className="flex-1 rounded-full bg-gold text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {isSavingProfile ? "Saving..." : "Save"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onStartEdit}
          className="w-full rounded-full border border-gold/20 px-4 py-2.5 text-sm font-semibold text-ink dark:text-parchment"
        >
          Edit profile
        </button>
      )}

      {isEditingProfile && isEmailOtpSent ? (
        <div className="rounded-xl border border-gold/10 bg-gold/5 px-3 py-2 text-center">
          <p className="text-xs italic text-muted">
            &ldquo;Your word is a lamp for my feet, a light on my path.&rdquo; - Psalm 119:105
          </p>
        </div>
      ) : null}

      <OtpModal
        open={isOtpModalOpen}
        onOpenChange={(open) => (open ? onOpenOtpModal() : onCloseOtpModal())}
        title="Please check your email"
        description="Enter the 6-digit code sent to your new email"
        otpValue={emailOtp}
        onOtpChange={onEmailOtpChange}
        onConfirm={onVerifyEmailOtp}
        onResend={onSendEmailOtp}
        isConfirming={isVerifyingEmailOtp}
        isResending={isSendingEmailOtp}
        isBusy={isSavingProfile}
        canResend={canResendEmailOtp}
        resendLabel={canResendEmailOtp ? "Send code again" : `Send again in ${otpResendCountdownLabel}`}
        invalidAttemptToken={emailOtpInvalidToken}
        helperText="Your word is a lamp for my feet, a light on my path. - Psalm 119:105"
      />
    </div>
  );
}
