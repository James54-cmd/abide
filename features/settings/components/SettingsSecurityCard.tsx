"use client";

type Props = {
  email: string;
  newPassword: string;
  confirmPassword: string;
  canSavePassword: boolean;
  isSavingPassword: boolean;
  isSendingReset: boolean;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onUpdatePassword: () => void;
  onSendReset: () => void;
};

export default function SettingsSecurityCard({
  email,
  newPassword,
  confirmPassword,
  canSavePassword,
  isSavingPassword,
  isSendingReset,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onUpdatePassword,
  onSendReset,
}: Props) {
  return (
    <div className="rounded-2xl border border-gold/10 bg-white dark:bg-dark-card p-4 shadow-warm space-y-4">
      <h3 className="text-base font-semibold text-ink dark:text-parchment">Security</h3>

      <div className="space-y-1">
        <label className="text-xs text-muted">Set new password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => onNewPasswordChange(event.target.value)}
          placeholder="At least 8 characters"
          className="w-full rounded-xl border border-gold/10 bg-transparent px-3 py-2 text-sm text-ink dark:text-parchment focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted">Confirm password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
          placeholder="Re-enter password"
          className="w-full rounded-xl border border-gold/10 bg-transparent px-3 py-2 text-sm text-ink dark:text-parchment focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onUpdatePassword}
          disabled={!canSavePassword || isSavingPassword}
          className="rounded-full bg-gold text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isSavingPassword ? "Updating..." : "Update password"}
        </button>
        <button
          type="button"
          onClick={onSendReset}
          disabled={!email || isSendingReset}
          className="rounded-full border border-gold/20 text-ink dark:text-parchment px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isSendingReset ? "Sending..." : "Send reset email"}
        </button>
      </div>
    </div>
  );
}
