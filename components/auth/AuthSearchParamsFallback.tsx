import AuthShell from "@/components/auth/AuthShell";
import PageLoader from "@/components/PageLoader";

export default function AuthSearchParamsFallback() {
  return (
    <AuthShell showChrome={false}>
      <PageLoader className="min-h-[70vh] w-full" />
    </AuthShell>
  );
}
