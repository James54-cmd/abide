"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { uploadAvatarFile } from "@/lib/api/settings/requests";
import {
  fetchMySettingsProfile,
  sendMyPasswordResetEmail,
  updateMyPassword,
  updateMySettingsProfile,
} from "@/lib/graphql/settings/hooks";
import { toast } from "sonner";
import type { SettingsProfile } from "@/features/settings/types";

function broadcastProfileTopbar(avatarUrl: string | null) {
  window.dispatchEvent(
    new CustomEvent("abide:profile-topbar", {
      detail: { avatarUrl },
    })
  );
}

export function useSettingsState() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const [profile, setProfile] = useState<SettingsProfile>({
    userId: null,
    email: "",
    fullName: "",
    avatarUrl: null,
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const canSavePassword = useMemo(
    () => newPassword.length >= 8 && newPassword === confirmPassword,
    [newPassword, confirmPassword]
  );

  useEffect(() => {
    async function loadProfile() {
      try {
        const profileData = await fetchMySettingsProfile();
        setProfile({
          userId: profileData.id,
          email: profileData.email,
          fullName: profileData.fullName ?? "",
          avatarUrl: profileData.avatarUrl ?? null,
        });
        broadcastProfileTopbar(profileData.avatarUrl ?? null);
      } catch {
        toast.error("Unable to load your profile");
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfile();
  }, []);

  const saveProfile = async () => {
    if (!profile.userId) return;

    try {
      setIsSavingProfile(true);
      await updateMySettingsProfile({
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
      });
      broadcastProfileTopbar(profile.avatarUrl);
      toast.success("Profile updated");
    } catch {
      toast.error("Could not save profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !profile.userId) return;

    try {
      setIsUploadingAvatar(true);
      const nextUrl = await uploadAvatarFile(file);
      await updateMySettingsProfile({
        fullName: profile.fullName,
        avatarUrl: nextUrl,
      });

      setProfile((prev) => ({ ...prev, avatarUrl: nextUrl }));
      broadcastProfileTopbar(nextUrl);
      toast.success("Avatar updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Avatar upload failed";
      toast.error(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    if (!profile.userId) return;

    try {
      setIsSavingProfile(true);
      await updateMySettingsProfile({
        fullName: profile.fullName,
        avatarUrl: null,
      });
      setProfile((prev) => ({ ...prev, avatarUrl: null }));
      broadcastProfileTopbar(null);
      toast.success("Avatar removed");
    } catch {
      toast.error("Could not remove avatar");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const setPassword = async () => {
    if (!canSavePassword) return;
    try {
      setIsSavingPassword(true);
      await updateMyPassword(newPassword);

      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch {
      toast.error("Could not update password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const sendResetEmail = async () => {
    if (!profile.email) return;
    try {
      setIsSendingReset(true);
      await sendMyPasswordResetEmail();
      toast.success("Reset email sent");
    } catch {
      toast.error("Could not send reset email");
    } finally {
      setIsSendingReset(false);
    }
  };

  return {
    isLoading,
    isSavingProfile,
    isUploadingAvatar,
    isSavingPassword,
    isSendingReset,
    profile,
    setProfile,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    canSavePassword,
    saveProfile,
    uploadAvatar,
    removeAvatar,
    setPassword,
    sendResetEmail,
  };
}
