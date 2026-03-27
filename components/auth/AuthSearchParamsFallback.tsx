import AuthShell from "@/components/auth/AuthShell";
import PageLoader from "@/components/PageLoader";

export default function AuthSearchParamsFallback() {
  return (
    <AuthShell>
      <PageLoader size="compact" className="min-h-[10rem]" />
    </AuthShell>
  );
}
