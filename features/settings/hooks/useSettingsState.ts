"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { uploadAvatarFile } from "@/lib/api/settings/requests";
import { requestEmailChangeOtp, verifyEmailChangeOtp } from "@/lib/api/auth/email-change";
import { fetchMySettingsProfile, updateMySettingsProfile } from "@/lib/graphql/settings/hooks";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { formatCountdown } from "@/lib/utils";
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

const EMAIL_CHANGE_OTP_LENGTH = 6;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

export function useSettingsState() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileNameBeforeEdit, setProfileNameBeforeEdit] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpResendCooldownSeconds, setOtpResendCooldownSeconds] = useState(0);

  const [profile, setProfile] = useState<SettingsProfile>({
    userId: null,
    email: "",
    fullName: "",
    avatarUrl: null,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const canSavePassword = useMemo(
    () =>
      currentPassword.length > 0 &&
      newPassword.length >= 8 &&
      newPassword === confirmPassword,
    [currentPassword, newPassword, confirmPassword]
  );
  const canResendEmailOtp = otpResendCooldownSeconds <= 0;
  const otpResendCountdownLabel = formatCountdown(otpResendCooldownSeconds);

  useEffect(() => {
    if (otpResendCooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setOtpResendCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpResendCooldownSeconds]);
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
    setIsOtpModalOpen(false);
    setOtpResendCooldownSeconds(0);
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    if (profileNameBeforeEdit !== null) {
      setProfile((prev) => ({ ...prev, fullName: profileNameBeforeEdit }));
    }
    setNewEmail(profile.email);
    setEmailOtp("");
    setIsEmailOtpSent(false);
    setIsOtpModalOpen(false);
    setOtpResendCooldownSeconds(0);
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
      setIsOtpModalOpen(true);
      setOtpResendCooldownSeconds(OTP_RESEND_COOLDOWN_SECONDS);
      toast.success("OTP sent to your new email.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send OTP.";
      toast.error(message);
      const retryMatch = message.match(/(\d+)s/);
      if (retryMatch) {
        const retrySeconds = Number(retryMatch[1]);
        if (Number.isFinite(retrySeconds) && retrySeconds > 0) {
          setOtpResendCooldownSeconds(retrySeconds);
        }
      }
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (!isEditingProfile || !isEmailOtpSent) return;
    const normalizedOtp = emailOtp.trim();
    if (!normalizedOtp) {
      toast.error("Please enter the OTP code.");
      return;
    }
    if (normalizedOtp.length !== EMAIL_CHANGE_OTP_LENGTH) {
      toast.error(`Please enter the ${EMAIL_CHANGE_OTP_LENGTH}-digit code.`);
      return;
    }

    try {
      setIsVerifyingEmailOtp(true);
      const result = await verifyEmailChangeOtp(normalizedOtp);
      setProfile((prev) => ({ ...prev, email: result.email }));
      setNewEmail(result.email);
      setEmailOtp("");
      setIsEmailOtpSent(false);
      setIsOtpModalOpen(false);
      setOtpResendCooldownSeconds(0);
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
    const email = profile.email?.trim();
    if (!email) {
      toast.error("No email on your profile. You cannot verify your current password here.");
      return;
    }

    try {
      setIsSavingPassword(true);
      const supabase = getSupabaseBrowserClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) {
        const hint = signInError.message.toLowerCase();
        toast.error(
          hint.includes("invalid") || hint.includes("wrong") || hint.includes("credentials")
            ? "Current password is incorrect."
            : signInError.message || "Could not verify your current password."
        );
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update password";
      toast.error(message);
    } finally {
      setIsSavingPassword(false);
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
    isLoggingOut,
    activeTab,
    isEditingProfile,
    newEmail,
    emailOtp,
    isSendingEmailOtp,
    isVerifyingEmailOtp,
    isEmailOtpSent,
    isOtpModalOpen,
    canResendEmailOtp,
    otpResendCountdownLabel,
    setActiveTab,
    profile,
    setProfile,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    setNewEmail,
    setEmailOtp,
    setIsOtpModalOpen,
    canSavePassword,
    saveProfile,
    startEditingProfile,
    cancelEditingProfile,
    sendEmailOtp,
    verifyEmailOtp,
    uploadAvatar,
    removeAvatar,
    setPassword,
    logout,
  };
}
