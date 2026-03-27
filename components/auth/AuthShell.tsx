import { ReactNode } from "react";
import Image from "next/image";

type AuthShellProps = {
  children: ReactNode;
};

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="mx-auto max-w-[430px] min-h-dvh flex flex-col items-center justify-center bg-parchment dark:bg-dark-bg px-6">
      <div className="flex flex-col items-center text-center mb-10">
        <Image
          src="/assets/abide-logo.png"
          alt="Abide"
          width={897}
          height={278}
          unoptimized
          className="h-14 w-[min(180px,78vw)] object-contain mb-1"
          priority
        />
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
