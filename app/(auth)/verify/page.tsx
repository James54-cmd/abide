"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resendVerificationWithGraphql } from "@/lib/graphql/auth";
import { Mail, RefreshCw, LogOut } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const queryEmail = searchParams.get("email");
      if (queryEmail) {
        setEmail(queryEmail);
      }

      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        if (user.email_confirmed_at) {
          router.replace("/");
          return;
        }
        setEmail(user.email ?? null);
      } else if (!queryEmail) {
        router.replace("/login");
      }
    };

    checkUser();
  }, [router]);

  const handleResend = async () => {
    if (!email) return;
    
    try {
      setIsResending(true);
      setMessage(null);
      setError(null);
      
      const success = await resendVerificationWithGraphql(email);

      if (!success) throw new Error("Failed to resend verification email.");
      
      setMessage("Verification email has been resent via Nodemailer. Please check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/login");
  };

  return (
    <AuthShell>
      <div className="w-full space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-2">
          <Mail className="w-10 h-10 text-gold" strokeWidth={1.5} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-ink dark:text-parchment">
            Verify your email
          </h2>
          <p className="text-sm text-muted">
            We sent a secure link to <span className="font-medium text-ink dark:text-parchment">{email}</span>. Click it to confirm your account.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <button
            onClick={handleResend}
            disabled={isResending || !email}
            className="w-full flex items-center justify-center gap-2 bg-gold text-white rounded-full py-3.5 text-sm font-semibold shadow-warm transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {isResending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              "Resend verification email"
            )}
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted hover:text-ink dark:hover:text-parchment transition-colors py-2"
          >
            <LogOut className="w-4 h-4" />
            Use a different account
          </button>
        </div>

        {message ? <p className="text-xs text-green-700">{message}</p> : null}
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        
        <div className="p-4 bg-white/50 dark:bg-dark-card/50 rounded-2xl border border-gold/5 text-xs text-muted italic">
          Tip: If you don&apos;t see it, check your spam folder. These emails are sent directly through our server for speed.
        </div>
      </div>
    </AuthShell>
  );
}
