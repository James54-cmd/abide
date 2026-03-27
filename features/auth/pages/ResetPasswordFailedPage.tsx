"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordResultCard from "@/features/auth/components/ResetPasswordResultCard";

function getFailedDescription(reason: string | null) {
  if (reason === "expired") {
    return "Your reset code has expired. Please request a new code to continue.";
  }
  if (reason === "invalid") {
    return "The reset code was not accepted. Please check it and try again.";
  }
  return "We could not reset your password securely. Please request a fresh reset code.";
}

export default function ResetPasswordFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = useMemo(() => searchParams.get("reason"), [searchParams]);

  return (
    <AuthShell>
      <div className="w-full space-y-4">
        <ResetPasswordResultCard
          tone="failed"
          title="Password reset failed"
          description={getFailedDescription(reason)}
          primaryLabel="Request new code"
          onPrimaryClick={() => router.replace("/reset-password")}
          secondaryLabel="Back to sign in"
          onSecondaryClick={() => router.replace("/login")}
        />
      </div>
    </AuthShell>
  );
}
