"use client";

type Props = {
  title: string;
  description: string;
  tone: "success" | "failed";
  primaryLabel: string;
  onPrimaryClick: () => void;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
};

export default function ResetPasswordResultCard({
  title,
  description,
  tone,
  primaryLabel,
  onPrimaryClick,
  secondaryLabel,
  onSecondaryClick,
}: Props) {
  const isSuccess = tone === "success";

  return (
    <div className="w-full rounded-3xl border border-gold/10 bg-white/70 dark:bg-dark-card/70 backdrop-blur-sm p-4 sm:p-5 space-y-4 shadow-warm">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-serif font-semibold text-ink dark:text-parchment">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>

      <p
        className={
          isSuccess
            ? "text-xs text-green-700 text-center rounded-2xl bg-green-50 px-3 py-2 border border-green-100"
            : "text-xs text-red-600 text-center rounded-2xl bg-red-50 px-3 py-2 border border-red-100"
        }
      >
        {isSuccess
          ? "Your account is secure with the new password."
          : "For security, please request a new code and try again."}
      </p>

      <button
        type="button"
        onClick={onPrimaryClick}
        className="w-full bg-gold text-white rounded-full py-3.5 text-sm font-semibold shadow-warm transition-all active:scale-[0.98]"
      >
        {primaryLabel}
      </button>

      {secondaryLabel && onSecondaryClick ? (
        <button
          type="button"
          onClick={onSecondaryClick}
          className="w-full border border-gold/20 text-ink dark:text-parchment rounded-full py-3.5 text-sm font-semibold transition-colors hover:bg-gold/5"
        >
          {secondaryLabel}
        </button>
      ) : null}
    </div>
  );
}
