import { Suspense } from "react";
import AuthSearchParamsFallback from "@/components/auth/AuthSearchParamsFallback";
import CancelEmailChangeSuccessPage from "@/features/auth/pages/CancelEmailChangeSuccessPage";

export default function Page() {
  return (
    <Suspense fallback={<AuthSearchParamsFallback />}>
      <CancelEmailChangeSuccessPage />
    </Suspense>
  );
}
