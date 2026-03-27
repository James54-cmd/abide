"use client";

type Props = {
  email: string;
  message: string | null;
  error: string | null;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
};

export default function ResetPasswordRequestCard({
  email,
  message,
  error,
  isSubmitting,
  onEmailChange,
  onSubmit,
}: Props) {
  return (
    <div className="w-full rounded-3xl border border-gold/10 bg-white/70 dark:bg-dark-card/70 backdrop-blur-sm p-4 sm:p-5 space-y-4 shadow-warm">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-serif font-semibold text-ink dark:text-parchment">
          Reset password
        </h2>
        <p className="text-sm text-muted">
          Enter your email and we will send you a link to choose a new password.
        </p>
      </div>

      <input
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="you@example.com"
        disabled={isSubmitting}
        className="w-full bg-white dark:bg-dark-card border border-gold/10 rounded-full px-4 py-3.5 text-sm text-ink dark:text-parchment placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60"
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full bg-gold text-white rounded-full py-3.5 text-sm font-semibold shadow-warm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Sending..." : "Send reset link"}
      </button>

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
