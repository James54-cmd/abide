"use client";

import Image from "next/image";
import type { ChangeEvent } from "react";
import { X } from "lucide-react";
import type { SettingsProfile } from "@/features/settings/types";
import { getAvatar, getInitials } from "@/lib/utils";

type Props = {
  profile: SettingsProfile;
  isLoading: boolean;
  isSavingProfile: boolean;
  isUploadingAvatar: boolean;
  onFullNameChange: (value: string) => void;
  onUploadAvatar: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  onSaveProfile: () => void;
};

export default function SettingsProfileCard({
  profile,
  isLoading,
  isSavingProfile,
  isUploadingAvatar,
  onFullNameChange,
  onUploadAvatar,
  onRemoveAvatar,
  onSaveProfile,
}: Props) {
  const avatarUrl = getAvatar(profile.avatarUrl);
  const initials = getInitials(profile.fullName);

  return (
    <div className="rounded-2xl border border-gold/10 bg-white dark:bg-dark-card p-4 shadow-warm space-y-4">
      <h3 className="text-base font-semibold text-ink dark:text-parchment">Profile</h3>

      <div className="flex flex-col items-center justify-center gap-3">
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
            <div className="h-28 w-28 rounded-full border border-gold/20 bg-gold/5 flex items-center justify-center text-2xl font-semibold text-gold">
              {initials}
            </div>
          )}
          {avatarUrl ? (
            <button
              type="button"
              onClick={onRemoveAvatar}
              disabled={isSavingProfile || isUploadingAvatar}
              className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-white dark:bg-dark-card border border-gold/20 flex items-center justify-center text-muted hover:text-red-500 disabled:opacity-60"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <label className="text-sm">
          <span className="inline-flex items-center rounded-full px-3 py-1.5 border border-gold/20 text-ink dark:text-parchment cursor-pointer">
            {isUploadingAvatar ? "Uploading..." : "Upload avatar"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUploadAvatar}
            disabled={isUploadingAvatar || isLoading}
          />
        </label>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted">Email</label>
        <input
          type="email"
          value={profile.email}
          disabled
          className="w-full rounded-xl border border-gold/10 bg-gold/5 px-3 py-2 text-sm text-muted"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted">Full name</label>
        <input
          type="text"
          value={profile.fullName}
          onChange={(event) => onFullNameChange(event.target.value)}
          placeholder="Your name"
          disabled={isLoading}
          className="w-full rounded-xl border border-gold/10 bg-transparent px-3 py-2 text-sm text-ink dark:text-parchment focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
      </div>

      <button
        type="button"
        onClick={onSaveProfile}
        disabled={isLoading || isSavingProfile}
        className="rounded-full bg-gold text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {isSavingProfile ? "Saving..." : "Save profile"}
      </button>
    </div>
  );
}
