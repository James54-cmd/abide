"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";

export default function CancelEmailChangeFailedPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") ?? "We could not cancel the email change request.";

  return (
    <AuthShell>
      <div className="w-full rounded-3xl border border-red-300/30 bg-white/70 dark:bg-dark-card/70 backdrop-blur-sm p-5 space-y-4 shadow-warm text-center">
        <h2 className="text-xl font-serif font-semibold text-ink dark:text-parchment">
          Cancellation failed
        </h2>
        <p className="text-sm text-red-600">{reason}</p>
        <p className="text-xs text-muted">
          You can request a new email-change verification from your profile settings.
        </p>
        <div className="flex gap-2">
          <Link
            href="/login"
            className="flex-1 rounded-full border border-gold/20 py-3 text-sm font-semibold text-ink dark:text-parchment"
          >
            Back to login
          </Link>
          <Link
            href="/settings"
            className="flex-1 rounded-full bg-gold text-white py-3 text-sm font-semibold"
          >
            Open settings
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
