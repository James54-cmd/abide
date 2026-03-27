"use client";

import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";

export default function CancelEmailChangeSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cooldown = searchParams.get("cooldown") ?? "60";

  const handleClose = () => {
    if (typeof window !== "undefined") {
      window.close();
    }
    setTimeout(() => {
      router.replace("/login");
    }, 200);
  };

  return (
    <AuthShell>
      <div className="w-full rounded-3xl border border-gold/10 bg-white/70 dark:bg-dark-card/70 backdrop-blur-sm p-5 space-y-4 shadow-warm text-center">
        <h2 className="text-xl font-serif font-semibold text-ink dark:text-parchment">
          Email change cancelled
        </h2>
        <p className="text-sm text-muted">
          The pending email change was cancelled successfully.
        </p>
        <p className="text-xs text-muted">
          For security, requesting another email-change OTP is temporarily limited for about {cooldown} seconds.
        </p>
        <button
          type="button"
          onClick={handleClose}
          className="w-full bg-gold text-white rounded-full py-3 text-sm font-semibold"
        >
          Close
        </button>
      </div>
    </AuthShell>
  );
}
