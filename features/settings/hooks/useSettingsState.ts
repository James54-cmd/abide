"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { uploadAvatarFile } from "@/lib/api/settings/requests";
import { requestEmailChangeOtp, verifyEmailChangeOtp } from "@/lib/api/auth/email-change";
import { requestPasswordResetEmail } from "@/lib/api/auth/password-reset";
import { fetchMySettingsProfile, updateMySettingsProfile } from "@/lib/graphql/settings/hooks";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SettingsProfile, SettingsTab } from "@/features/settings/types";

function broadcastProfileTopbar(avatarUrl: string | null) {
  window.dispatchEvent(
    new CustomEvent("abide:profile-topbar", {
      detail: { avatarUrl },
    })
  );
}

export function useSettingsState() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileNameBeforeEdit, setProfileNameBeforeEdit] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);

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
      setIsEditingProfile(false);
      setProfileNameBeforeEdit(null);
    } catch {
      toast.error("Could not save profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const startEditingProfile = () => {
    setProfileNameBeforeEdit(profile.fullName);
    setNewEmail(profile.email);
    setEmailOtp("");
    setIsEmailOtpSent(false);
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    if (profileNameBeforeEdit !== null) {
      setProfile((prev) => ({ ...prev, fullName: profileNameBeforeEdit }));
    }
    setNewEmail(profile.email);
    setEmailOtp("");
    setIsEmailOtpSent(false);
    setIsEditingProfile(false);
    setProfileNameBeforeEdit(null);
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !profile.userId || !isEditingProfile) return;

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
    if (!profile.userId || !isEditingProfile) return;

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

  const sendEmailOtp = async () => {
    if (!isEditingProfile) return;
    if (!newEmail.trim()) {
      toast.error("Please enter your new email.");
      return;
    }
    if (newEmail.trim().toLowerCase() === profile.email.trim().toLowerCase()) {
      toast.error("Please enter a different email.");
      return;
    }

    try {
      setIsSendingEmailOtp(true);
      await requestEmailChangeOtp(newEmail);
      setIsEmailOtpSent(true);
      toast.success("OTP sent to your new email.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send OTP.";
      toast.error(message);
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (!isEditingProfile || !isEmailOtpSent) return;
    if (!emailOtp.trim()) {
      toast.error("Please enter the OTP code.");
      return;
    }

    try {
      setIsVerifyingEmailOtp(true);
      const result = await verifyEmailChangeOtp(emailOtp);
      setProfile((prev) => ({ ...prev, email: result.email }));
      setNewEmail(result.email);
      setEmailOtp("");
      setIsEmailOtpSent(false);
      toast.success("Email updated successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not verify OTP.";
      toast.error(message);
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  const setPassword = async () => {
    if (!canSavePassword) return;
    try {
      setIsSavingPassword(true);
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

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
      await requestPasswordResetEmail(profile.email);
      toast.success("Reset email sent");
    } catch {
      toast.error("Could not send reset email");
    } finally {
      setIsSendingReset(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut({ scope: "local" });
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Could not log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    isLoading,
    isSavingProfile,
    isUploadingAvatar,
    isSavingPassword,
    isSendingReset,
    isLoggingOut,
    activeTab,
    isEditingProfile,
    newEmail,
    emailOtp,
    isSendingEmailOtp,
    isVerifyingEmailOtp,
    isEmailOtpSent,
    setActiveTab,
    profile,
    setProfile,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    setNewEmail,
    setEmailOtp,
    canSavePassword,
    saveProfile,
    startEditingProfile,
    cancelEditingProfile,
    sendEmailOtp,
    verifyEmailOtp,
    uploadAvatar,
    removeAvatar,
    setPassword,
    sendResetEmail,
    logout,
  };
}
