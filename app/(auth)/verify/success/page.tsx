"use client";

import AuthShell from "@/components/auth/AuthShell";
import { CheckCircle2, PartyPopper } from "lucide-react";
import Link from "next/link";

export default function VerifySuccessPage() {
  return (
    <AuthShell>
      <div className="w-full space-y-8 text-center">
        <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto relative">
          <CheckCircle2 className="w-12 h-12 text-green-500" strokeWidth={1.5} />
          <div className="absolute -top-1 -right-1">
             <PartyPopper className="w-8 h-8 text-gold animate-bounce" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl font-serif font-bold text-ink dark:text-parchment">
            Verified!
          </h2>
          <p className="text-sm text-muted">
            Your account has been successfully verified.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-dark-card rounded-2xl border border-gold/10 shadow-warm space-y-4">
          <p className="text-sm font-medium text-ink dark:text-parchment">
            You can now close this tab and return to the original page to start using Abide.
          </p>
          <div className="h-px bg-gold/5 w-full" />
          <Link
            href="/login"
            className="inline-block text-gold text-sm font-semibold hover:underline"
          >
            Or, click here to log in in this tab instead.
          </Link>
        </div>

        <p className="text-xs text-muted italic">
          Welcome to the family. May God&apos;s Word light your path today.
        </p>
      </div>
    </AuthShell>
  );
}
