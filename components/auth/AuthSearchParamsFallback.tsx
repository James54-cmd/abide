import AuthShell from "@/components/auth/AuthShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuthSearchParamsFallback() {
  return (
    <AuthShell>
      <Skeleton className="h-44 w-full max-w-sm rounded-3xl" />
    </AuthShell>
  );
}
