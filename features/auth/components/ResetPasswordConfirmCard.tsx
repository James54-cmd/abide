"use client";

type Props = {
  hasToken: boolean;
  newPassword: string;
  confirmPassword: string;
  message: string | null;
  error: string | null;
  isSubmitting: boolean;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export default function ResetPasswordConfirmCard({
  hasToken,
  newPassword,
  confirmPassword,
  message,
  error,
  isSubmitting,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: Props) {
  return (
    <div className="w-full rounded-3xl border border-gold/10 bg-white/70 dark:bg-dark-card/70 backdrop-blur-sm p-4 sm:p-5 space-y-4 shadow-warm">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-serif font-semibold text-ink dark:text-parchment">
          Choose a new password
        </h2>
        <p className="text-sm text-muted">
          {hasToken
            ? "Enter your new password below."
            : "Open the link from your email to continue."}
        </p>
      </div>

      {!hasToken ? (
        <p className="text-xs text-red-600 text-center rounded-2xl bg-red-50 px-3 py-2 border border-red-100">
          This page needs a valid link from your email. Request a new reset link below.
        </p>
      ) : null}

      {hasToken ? (
        <>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            placeholder="New password"
            disabled={isSubmitting}
            className="w-full bg-white dark:bg-dark-card border border-gold/10 rounded-full px-4 py-3.5 text-sm text-ink dark:text-parchment placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            placeholder="Confirm new password"
            disabled={isSubmitting}
            className="w-full bg-white dark:bg-dark-card border border-gold/10 rounded-full px-4 py-3.5 text-sm text-ink dark:text-parchment placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full bg-gold text-white rounded-full py-3.5 text-sm font-semibold shadow-warm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </>
      ) : null}

      {message ? (
        <p className="text-xs text-green-700 text-center rounded-2xl bg-green-50 px-3 py-2 border border-green-100">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-red-600 text-center rounded-2xl bg-red-50 px-3 py-2 border border-red-100">
          {error}
        </p>
      ) : null}
    </div>
  );
}
