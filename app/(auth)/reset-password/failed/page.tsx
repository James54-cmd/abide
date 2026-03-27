import { Suspense } from "react";
import AuthSearchParamsFallback from "@/components/auth/AuthSearchParamsFallback";
import ResetPasswordFailedPage from "@/features/auth/pages/ResetPasswordFailedPage";

export default function Page() {
  return (
    <Suspense fallback={<AuthSearchParamsFallback />}>
      <ResetPasswordFailedPage />
    </Suspense>
  );
}
