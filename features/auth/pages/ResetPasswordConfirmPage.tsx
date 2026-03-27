"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordConfirmCard from "@/features/auth/components/ResetPasswordConfirmCard";
import { useResetPasswordConfirmState } from "@/features/auth/hooks/useResetPasswordConfirmState";

export default function ResetPasswordConfirmPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? null, [searchParams]);
  const state = useResetPasswordConfirmState(token);

  return (
    <AuthShell>
      <div className="w-full space-y-4">
        <ResetPasswordConfirmCard
          hasToken={Boolean(token)}
          newPassword={state.newPassword}
          confirmPassword={state.confirmPassword}
          message={state.message}
          error={state.error}
          isSubmitting={state.isSubmitting}
          onNewPasswordChange={state.setNewPassword}
          onConfirmPasswordChange={state.setConfirmPassword}
          onSubmit={() => void state.submit()}
        />
        <p className="text-center">
          <Link
            href="/reset-password"
            className="text-xs font-medium text-muted hover:text-ink dark:hover:text-parchment transition-colors"
          >
            Request a new link
          </Link>
          <span className="text-muted mx-2">·</span>
          <Link
            href="/login"
            className="text-xs font-medium text-gold hover:text-gold/80 transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
