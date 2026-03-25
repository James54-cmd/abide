"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Mail, RefreshCw, ArrowLeft } from "lucide-react";

function formatRetryMessage(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes <= 0) return `${remainingSeconds}s`;
  if (remainingSeconds <= 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
}

export default function ResendVerificationPage() {
  const router = useRouter();
  const hasRequestedRef = useRef(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveEmailAndSend = async () => {
      if (hasRequestedRef.current) return;
      hasRequestedRef.current = true;

      const queryEmail = new URLSearchParams(window.location.search).get("email") ?? "";
      if (queryEmail.trim()) {
        const normalized = queryEmail.trim().toLowerCase();
        setTargetEmail(normalized);
        await handleResend(normalized);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const emailFromSession = user?.email?.trim().toLowerCase() ?? "";
      if (!emailFromSession) {
        setError("We could not find your email. Please go back to login.");
        return;
      }

      setTargetEmail(emailFromSession);
      await handleResend(emailFromSession);
    };

    void resolveEmailAndSend();
  }, []);

  const handleResend = async (email: string) => {
    if (!email.trim()) {
      setError("We could not find your email. Please go back to login.");
      return;
    }

    try {
      setIsResending(true);
      setMessage(null);
      setError(null);

      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const json = (await response.json()) as
        | { success?: boolean; error?: string; retryAfterSeconds?: number }
        | undefined;

      if (!response.ok) {
        if (response.status === 429 && typeof json?.retryAfterSeconds === "number") {
          throw new Error(
            `Please wait ${formatRetryMessage(json.retryAfterSeconds)} before trying again.`
          );
        }
        throw new Error(json?.error ?? "Failed to resend verification email.");
      }

      setMessage(`Verification email sent to ${email}. Please check your email.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell>
      <div className="w-full space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-2">
          <Mail className="w-10 h-10 text-gold" strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-ink dark:text-parchment">
            Resend verification email
          </h2>
          <p className="text-sm text-muted">
            We are sending a new verification link now.
          </p>
        </div>

        <button
          onClick={() => void handleResend(targetEmail)}
          disabled={isResending || !targetEmail.trim()}
          className="w-full flex items-center justify-center gap-2 bg-gold text-white rounded-full py-3.5 text-sm font-semibold shadow-warm transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {isResending ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Send again"}
        </button>

        <button
          onClick={() => router.replace("/login")}
          className="w-full flex items-center justify-center gap-2 text-sm text-muted hover:text-ink dark:hover:text-parchment transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>

        {message ? <p className="text-xs text-green-700">{message}</p> : null}
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    </AuthShell>
  );
}
