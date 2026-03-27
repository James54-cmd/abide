"use client";

import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordRequestCard from "@/features/auth/components/ResetPasswordRequestCard";
import { useResetPasswordRequestState } from "@/features/auth/hooks/useResetPasswordRequestState";

export default function ResetPasswordRequestPage() {
  const state = useResetPasswordRequestState();

  return (
    <AuthShell>
      <div className="w-full space-y-4">
        <ResetPasswordRequestCard
          email={state.email}
          message={state.message}
          error={state.error}
          isSubmitting={state.isSubmitting}
          onEmailChange={state.setEmail}
          onSubmit={() => void state.submit()}
        />
        <p className="text-center">
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
