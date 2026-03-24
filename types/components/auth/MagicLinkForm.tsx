type MagicLinkFormProps = {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  message?: string | null;
  error?: string | null;
};

export default function MagicLinkForm({
  email,
  onEmailChange,
  onSubmit,
  disabled = false,
  isLoading = false,
  message,
  error,
}: MagicLinkFormProps) {
  return (
    <>
      <input
        type="email"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="you@example.com"
        className="w-full bg-white dark:bg-dark-card border border-gold/10 rounded-full px-4 py-3.5 text-sm text-ink dark:text-parchment placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
      />

      <button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full bg-gold text-white rounded-full py-3.5 text-sm font-semibold shadow-warm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? "Sending..." : "Sign in with Magic Link"}
      </button>

      {message ? <p className="text-xs text-green-700 text-center">{message}</p> : null}
      {error ? <p className="text-xs text-red-600 text-center">{error}</p> : null}
    </>
  );
}
