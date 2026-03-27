"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import PageLoader from "@/components/PageLoader";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { loginWithGraphql } from "@/lib/graphql/auth";
import { formatRetryMessage } from "@/lib/auth/verification";
import { Mail, RefreshCw, LogOut } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVerifiedLocally, setIsVerifiedLocally] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "verified" | "pending" | "expired" | null
  >(null);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    const supabase = getSupabaseBrowserClient();
    type RemoveChannelArg = Parameters<typeof supabase.removeChannel>[0];
    let channel: RemoveChannelArg | null = null;

    type ProfileUpdatePayload = {
      new?: {
        verification_status?: unknown;
      };
    };

    function isProfileUpdatePayload(payload: unknown): payload is ProfileUpdatePayload {
      if (typeof payload !== "object" || payload === null) return false;
      if (!("new" in payload)) return false;
      const maybeNew = (payload as { new?: unknown }).new;
      return typeof maybeNew === "object" && maybeNew !== null;
    }

    const checkUser = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const queryEmail = searchParams.get("email");
      if (queryEmail) {
        setEmail(queryEmail);
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 1. Initial check
        const { data: rawProfile } = await (supabase
          .from("profiles")
          .select("verification_status")
          .eq("id", user.id)
          .single());

        const profile = rawProfile as unknown as { verification_status?: string } | null;

        if (profile?.verification_status === "verified") {
          setIsVerifiedLocally(true);
          setVerificationStatus("verified");
          return;
        }
        if (profile?.verification_status === "pending") {
          setVerificationStatus("pending");
        }
        setEmail(user.email ?? null);

        // 2. Setup Realtime Subscription
        channel = supabase
          .channel(`profile-updates-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${user.id}`,
            },
            (payload: unknown) => {
              if (isProfileUpdatePayload(payload)) {
                const status = payload.new?.verification_status;
                if (status === "verified") {
                  setIsVerifiedLocally(true);
                } else if (status === "pending") {
                  setVerificationStatus("pending");
                } else if (status === "expired") {
                  setVerificationStatus("expired");
                  router.replace(`/resend_verification?email=${encodeURIComponent(user.email ?? "")}`);
                }
              }
            }
          )
          .subscribe();
      } else if (!queryEmail) {
        router.replace("/login");
        return;
      }

      pollInterval = setInterval(async () => {
        const currentEmail = queryEmail || (await supabase.auth.getUser()).data.user?.email;
        if (!currentEmail) return;

        try {
          const res = await fetch(`/api/auth/verify-status?email=${encodeURIComponent(currentEmail)}`);
          const json: unknown = await res.json();

          const status =
            typeof json === "object" &&
            json !== null &&
            "status" in json &&
            typeof (json as { status?: unknown }).status === "string"
              ? (json as { status: string }).status
              : null;

          if (status === "verified") {
            clearInterval(pollInterval);
            setIsVerifiedLocally(true);
            setVerificationStatus("verified");

            const storedPassword = sessionStorage.getItem("abide_pending_password");
            if (storedPassword && currentEmail) {
                try {
                  const result = await loginWithGraphql({ email: currentEmail, password: storedPassword });
                  if (result.accessToken && result.refreshToken) {
                    await supabase.auth.setSession({
                      access_token: result.accessToken,
                      refresh_token: result.refreshToken,
                    });
                    sessionStorage.removeItem("abide_pending_email");
                    sessionStorage.removeItem("abide_pending_password");
                  }
                } catch (err) {
                  // Ignore auto-login errors here to just proceed with redirect
                }
            }
          } else if (status === "pending") {
            setVerificationStatus("pending");
          } else if (status === "expired") {
            setVerificationStatus("expired");
            clearInterval(pollInterval);
            router.replace(`/resend_verification?email=${encodeURIComponent(currentEmail)}`);
          }
        } catch (err) {
          // Ignore poll errors
        }
      }, 1500);
    };

    checkUser();
    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  useEffect(() => {
    if (!isVerifiedLocally) return;
    const id = window.setTimeout(() => router.replace("/"), 1600);
    return () => window.clearTimeout(id);
  }, [isVerifiedLocally, router]);

  const handleResend = async () => {
    if (!email) return;
    
    try {
      setIsResending(true);
      setMessage(null);
      setError(null);
      
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await response.json()) as
        | { success?: boolean; error?: string; retryAfterSeconds?: number }
        | undefined;
      if (!response.ok) {
        if (response.status === 429 && typeof json?.retryAfterSeconds === "number") {
          throw new Error(`Please wait ${formatRetryMessage(json.retryAfterSeconds)} before trying again.`);
        }
        throw new Error(json?.error ?? "Failed to resend verification email.");
      }
      
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

  if (isVerifiedLocally) {
    return (
      <AuthShell>
        <PageLoader className="min-h-[55vh]" />
      </AuthShell>
    );
  }

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
          {verificationStatus === "pending" ? (
            <div className="inline-flex items-center justify-center rounded-full bg-gold/10 border border-gold/10 px-3 py-1 text-xs font-semibold text-gold">
              Status: Pending verification
            </div>
          ) : null}
          {verificationStatus === "expired" ? (
            <div className="inline-flex items-center justify-center rounded-full bg-red-500/10 border border-red-400/20 px-3 py-1 text-xs font-semibold text-red-600">
              Status: Link expired
            </div>
          ) : null}
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
