"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  canSavePassword: boolean;
  isSavingPassword: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onUpdatePassword: () => void;
};

export default function SettingsSecurityCard({
  currentPassword,
  newPassword,
  confirmPassword,
  canSavePassword,
  isSavingPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onUpdatePassword,
}: Props) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="rounded-2xl border border-gold/10 bg-white dark:bg-dark-card p-4 shadow-warm space-y-4">
      <h3 className="text-base font-semibold text-ink dark:text-parchment">Security</h3>

      <div className="space-y-1">
        <label className="text-xs text-muted">Current password</label>
        <div className="relative">
          <input
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(event) => onCurrentPasswordChange(event.target.value)}
            placeholder="Required to change password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-gold/10 bg-transparent px-3 py-2 pr-10 text-sm text-ink dark:text-parchment focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink dark:hover:text-parchment"
            aria-label={showCurrentPassword ? "Hide password" : "Show password"}
          >
            {showCurrentPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted">New password</label>
        <div className="relative">
          <input
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(event) => onNewPasswordChange(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            className="w-full rounded-xl border border-gold/10 bg-transparent px-3 py-2 pr-10 text-sm text-ink dark:text-parchment focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink dark:hover:text-parchment"
            aria-label={showNewPassword ? "Hide password" : "Show password"}
          >
            {showNewPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted">Confirm new password</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => onConfirmPasswordChange(event.target.value)}
            placeholder="Re-enter new password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-gold/10 bg-transparent px-3 py-2 pr-10 text-sm text-ink dark:text-parchment focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink dark:hover:text-parchment"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onUpdatePassword}
        disabled={!canSavePassword || isSavingPassword}
        className="w-full rounded-full bg-gold text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
      >
        {isSavingPassword ? "Updating..." : "Update password"}
      </button>
    </div>
  );
}
