"use client";

import Image from "next/image";
import { X } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import SettingsProfileCard from "@/features/settings/components/SettingsProfileCard";
import SettingsSecurityCard from "@/features/settings/components/SettingsSecurityCard";
import { useSettingsState } from "@/features/settings/hooks/useSettingsState";
import { getAvatar, getInitials } from "@/lib/utils";

export default function SettingsPage() {
  const state = useSettingsState();
  const avatarUrl = getAvatar(state.profile.avatarUrl);
  const initials = getInitials(state.profile.fullName);

  return (
    <PageTransition>
      <div className="px-4 pt-6 pb-8 max-w-xl mx-auto">
        <div className="rounded-3xl border border-gold/10 bg-white dark:bg-dark-card p-6 shadow-warm text-center space-y-6">
          <h2 className="text-xl font-serif font-semibold text-ink dark:text-parchment">
            Profile
          </h2>
          <div className="flex justify-center">
            <div className="relative">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile avatar"
                  width={112}
                  height={112}
                  unoptimized
                  className="h-28 w-28 rounded-full object-cover border border-gold/20"
                />
              ) : (
                <div className="h-28 w-28 rounded-full border border-gold/20 bg-gold/5 flex items-center justify-center text-3xl font-semibold text-gold">
                  {initials}
                </div>
              )}
              {avatarUrl && state.isEditingProfile ? (
                <button
                  type="button"
                  onClick={() => void state.removeAvatar()}
                  disabled={state.isSavingProfile || state.isUploadingAvatar}
                  className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-white dark:bg-dark-card border border-gold/20 flex items-center justify-center text-muted hover:text-red-500 disabled:opacity-60"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
          <div>
            <label className="text-sm">
              <span className="inline-flex items-center rounded-full px-3 py-1.5 border border-gold/20 text-ink dark:text-parchment cursor-pointer">
                {state.isUploadingAvatar ? "Uploading..." : "Upload avatar"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={state.uploadAvatar}
                disabled={!state.isEditingProfile || state.isUploadingAvatar || state.isLoading}
              />
            </label>
          </div>
          <div>
            <h3 className="text-2xl font-serif font-semibold text-ink dark:text-parchment">
              {state.profile.fullName || "Your Profile"}
            </h3>
            <p className="text-sm text-muted mt-1">{state.profile.email || "No email available"}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-full bg-parchment dark:bg-dark-bg p-1 border border-gold/10 mt-2">
            <button
              type="button"
              onClick={() => state.setActiveTab("profile")}
              className={`rounded-full py-2 text-xs font-semibold transition-colors ${
                state.activeTab === "profile"
                  ? "bg-gold text-white"
                  : "text-muted hover:text-ink dark:hover:text-parchment"
              }`}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => state.setActiveTab("security")}
              className={`rounded-full py-2 text-xs font-semibold transition-colors ${
                state.activeTab === "security"
                  ? "bg-gold text-white"
                  : "text-muted hover:text-ink dark:hover:text-parchment"
              }`}
            >
              Account & Security
            </button>
          </div>
          <div className="border-t border-gold/10 pt-4">
            {state.activeTab === "profile" ? (
              <div className="space-y-3 text-left">
                <h4 className="text-sm font-semibold text-ink dark:text-parchment px-1">
                  General Information
                </h4>
                <SettingsProfileCard
                  profile={state.profile}
                  newEmail={state.newEmail}
                  emailOtp={state.emailOtp}
                  isLoading={state.isLoading}
                  isSavingProfile={state.isSavingProfile}
                  isEditingProfile={state.isEditingProfile}
                  isSendingEmailOtp={state.isSendingEmailOtp}
                  isVerifyingEmailOtp={state.isVerifyingEmailOtp}
                  isEmailOtpSent={state.isEmailOtpSent}
                  isOtpModalOpen={state.isOtpModalOpen}
                  canResendEmailOtp={state.canResendEmailOtp}
                  otpResendCountdownLabel={state.otpResendCountdownLabel}
                  onFullNameChange={(value) =>
                    state.setProfile((prev) => ({
                      ...prev,
                      fullName: value,
                    }))
                  }
                  onNewEmailChange={state.setNewEmail}
                  onEmailOtpChange={state.setEmailOtp}
                  onStartEdit={state.startEditingProfile}
                  onCancelEdit={state.cancelEditingProfile}
                  onSendEmailOtp={() => void state.sendEmailOtp()}
                  onOpenOtpModal={() => state.setIsOtpModalOpen(true)}
                  onCloseOtpModal={() => state.setIsOtpModalOpen(false)}
                  onVerifyEmailOtp={() => void state.verifyEmailOtp()}
                  onSaveProfile={() => void state.saveProfile()}
                />
              </div>
            ) : (
              <div className="space-y-3 text-left">
                <h4 className="text-sm font-semibold text-ink dark:text-parchment px-1">
                  Account & Security
                </h4>
                <SettingsSecurityCard
                  currentPassword={state.currentPassword}
                  newPassword={state.newPassword}
                  confirmPassword={state.confirmPassword}
                  canSavePassword={state.canSavePassword}
                  isSavingPassword={state.isSavingPassword}
                  onCurrentPasswordChange={state.setCurrentPassword}
                  onNewPasswordChange={state.setNewPassword}
                  onConfirmPasswordChange={state.setConfirmPassword}
                  onUpdatePassword={() => void state.setPassword()}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => void state.logout()}
            disabled={state.isLoggingOut}
            className="w-full rounded-2xl border border-red-400/30 text-red-600 py-3.5 text-sm font-semibold bg-white dark:bg-dark-card disabled:opacity-60"
          >
            {state.isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
