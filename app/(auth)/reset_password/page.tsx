"use client";

import { Suspense } from "react";
import ResetPasswordConfirmPage from "@/features/auth/pages/ResetPasswordConfirmPage";

function ResetPasswordFallback() {
  return (
    <div className="mx-auto max-w-[430px] min-h-dvh flex items-center justify-center bg-parchment px-6">
      <p className="text-sm text-muted">Loading...</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordConfirmPage />
    </Suspense>
  );
}
