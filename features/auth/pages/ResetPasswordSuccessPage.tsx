"use client";

import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordResultCard from "@/features/auth/components/ResetPasswordResultCard";

export default function ResetPasswordSuccessPage() {
  const router = useRouter();

  return (
    <AuthShell>
      <div className="w-full space-y-4">
        <ResetPasswordResultCard
          tone="success"
          title="Password updated"
          description="Your password has been changed successfully."
          primaryLabel="Back to sign in"
          onPrimaryClick={() => router.replace("/login?message=Password%20updated.%20Please%20log%20in.")}
          secondaryLabel="Go to reset password"
          onSecondaryClick={() => router.replace("/reset-password")}
        />
      </div>
    </AuthShell>
  );
}
