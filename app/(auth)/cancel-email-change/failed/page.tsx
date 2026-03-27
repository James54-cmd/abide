import { Suspense } from "react";
import AuthSearchParamsFallback from "@/components/auth/AuthSearchParamsFallback";
import CancelEmailChangeFailedPage from "@/features/auth/pages/CancelEmailChangeFailedPage";

export default function Page() {
  return (
    <Suspense fallback={<AuthSearchParamsFallback />}>
      <CancelEmailChangeFailedPage />
    </Suspense>
  );
}
