import { CheckCircle2 } from "lucide-react";

type VerificationSuccessStateProps = {
  title?: string;
  description?: string;
};

export default function VerificationSuccessState({
  title = "Account Verified!",
  description = "Redirecting you to the app...",
}: VerificationSuccessStateProps) {
  return (
    <div className="w-full space-y-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      <h2 className="text-2xl font-serif font-semibold text-ink dark:text-parchment">{title}</h2>
      <p className="text-sm text-muted">{description}</p>
    </div>
  );
}
