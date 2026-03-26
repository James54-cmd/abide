"use client";

import PageTransition from "@/components/PageTransition";
import SettingsProfileCard from "@/features/settings/components/SettingsProfileCard";
import SettingsSecurityCard from "@/features/settings/components/SettingsSecurityCard";
import { useSettingsState } from "@/features/settings/hooks/useSettingsState";

export default function SettingsPage() {
  const state = useSettingsState();

  return (
    <PageTransition>
      <div className="px-4 pt-6 pb-8 space-y-6">
        <div>
          <h2 className="text-xl font-serif font-semibold text-ink dark:text-parchment">
            Settings
          </h2>
          <p className="text-sm text-muted mt-1">
            Manage your profile, avatar, and password.
          </p>
        </div>

        <SettingsProfileCard
          profile={state.profile}
          isLoading={state.isLoading}
          isSavingProfile={state.isSavingProfile}
          isUploadingAvatar={state.isUploadingAvatar}
          onFullNameChange={(value) =>
            state.setProfile((prev) => ({
              ...prev,
              fullName: value,
            }))
          }
          onUploadAvatar={state.uploadAvatar}
          onRemoveAvatar={() => void state.removeAvatar()}
          onSaveProfile={() => void state.saveProfile()}
        />

        <SettingsSecurityCard
          email={state.profile.email}
          newPassword={state.newPassword}
          confirmPassword={state.confirmPassword}
          canSavePassword={state.canSavePassword}
          isSavingPassword={state.isSavingPassword}
          isSendingReset={state.isSendingReset}
          onNewPasswordChange={state.setNewPassword}
          onConfirmPasswordChange={state.setConfirmPassword}
          onUpdatePassword={() => void state.setPassword()}
          onSendReset={() => void state.sendResetEmail()}
        />
      </div>
    </PageTransition>
  );
}
