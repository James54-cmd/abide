import { ReactNode } from "react";
import { Cross } from "lucide-react";

type AuthShellProps = {
  children: ReactNode;
};

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="mx-auto max-w-[430px] min-h-dvh flex flex-col items-center justify-center bg-parchment dark:bg-dark-bg px-6">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
          <Cross className="w-8 h-8 text-gold" strokeWidth={1.2} />
        </div>
        <h1 className="text-3xl font-serif font-semibold text-ink dark:text-parchment">
          Abide
        </h1>
        <p className="text-sm text-muted mt-2">
          Bible encouragement, always with you.
        </p>
      </div>

      {children}

      <p className="text-xs text-muted mt-8 text-center">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
