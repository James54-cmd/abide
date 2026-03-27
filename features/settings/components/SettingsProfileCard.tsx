"use client";

import type { SettingsProfile } from "@/features/settings/types";

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
  onFullNameChange: (value: string) => void;
  onNewEmailChange: (value: string) => void;
  onEmailOtpChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSendEmailOtp: () => void;
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
  onFullNameChange,
  onNewEmailChange,
  onEmailOtpChange,
  onStartEdit,
  onCancelEdit,
  onSendEmailOtp,
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
              disabled={isSendingEmailOtp || isSavingProfile}
              className="rounded-full border border-gold/20 px-3 py-2 text-xs font-semibold text-ink dark:text-parchment disabled:opacity-60"
            >
              {isSendingEmailOtp ? "Sending..." : "Send OTP"}
            </button>
          </div>

          {isEmailOtpSent ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={emailOtp}
                onChange={(event) => onEmailOtpChange(event.target.value)}
                placeholder="Enter OTP"
                className="flex-1 rounded-xl border border-gold/10 bg-transparent px-3 py-2 text-sm text-ink dark:text-parchment focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <button
                type="button"
                onClick={onVerifyEmailOtp}
                disabled={isVerifyingEmailOtp || isSavingProfile}
                className="rounded-full bg-gold text-white px-3 py-2 text-xs font-semibold disabled:opacity-60"
              >
                {isVerifyingEmailOtp ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
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
        <p className="text-xs text-muted">A verification code was sent to your new email.</p>
      ) : null}
    </div>
  );
}
