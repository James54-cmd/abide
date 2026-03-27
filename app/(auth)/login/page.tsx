"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { loginWithGraphql, signUpWithGraphql } from "@/lib/graphql/auth";
import { getSafeAuthRedirectUrl } from "@/lib/auth/redirect";
import { formatRetryMessage } from "@/lib/auth/verification";
import { getSupabaseBrowserClient } from "@/lib/supabase";

function getAuthRedirectUrl() {
  return (
    getSafeAuthRedirectUrl({
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      fallbackOrigin: window.location.origin,
    }) ?? `${window.location.origin}/auth/callback`
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const msg = searchParams.get("message");
    const err = searchParams.get("error");
    
    if (msg) {
      setMessage(msg);
      setMode("login");
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (err) {
      setError(err);
      setMode("login");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const validateForm = () => {
    if (mode === "signup" && !fullName.trim()) {
      setError("Please enter your full name.");
      return false;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    return true;
  };

  const handleCredentialsSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoadingCredentials(true);
      setMessage(null);
      setError(null);

      if (mode === "signup") {
        const redirectTo = getAuthRedirectUrl();
        const normalizedEmail = email.trim().toLowerCase();
        const result = await signUpWithGraphql({
          fullName: fullName.trim(),
          email: normalizedEmail,
          password,
          redirectTo,
        });

        if (result.success) {
          // Store credentials temporarily for auto-login on verification
          sessionStorage.setItem("abide_pending_email", normalizedEmail);
          sessionStorage.setItem("abide_pending_password", password);

          if (result.accessToken && result.refreshToken) {
            const supabase = getSupabaseBrowserClient();
            await supabase.auth.setSession({
              access_token: result.accessToken,
              refresh_token: result.refreshToken,
            });
          }
          router.push(`/verify?email=${encodeURIComponent(normalizedEmail)}`);
          return;
        }

        setMessage(result.message ?? "Account created. Please check your email to confirm your signup.");
        return;
      }

      const result = await loginWithGraphql({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!result.success) {
        setError(result.message ?? "Login failed.");
        return;
      }

      if (!result.accessToken || !result.refreshToken) {
        throw new Error("Login did not return session tokens.");
      }

      const supabase = getSupabaseBrowserClient();
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
      });
      if (setSessionError) throw setSessionError;

      router.replace("/");
    } catch (err) {
      const fallbackError = `Unable to ${mode === "signup" ? "sign up" : "log in"}.`;
      const nextError = err instanceof Error ? err.message : fallbackError;

      if (mode === "signup" && email.trim()) {
        const normalizedEmail = email.trim().toLowerCase();
        try {
          const statusResponse = await fetch(
            `/api/auth/verify-status?email=${encodeURIComponent(normalizedEmail)}`
          );
          const statusJson = (await statusResponse.json()) as { status?: string };
          if (statusJson.status === "pending" || statusJson.status === "expired") {
            router.push(`/resend_verification?email=${encodeURIComponent(normalizedEmail)}`);
            return;
          }
        } catch {
          // fall back to the signup error shown below
        }
      }

      setError(nextError);
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const handleResendFromLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Enter your email first to resend verification.");
      return;
    }

    try {
      setIsResending(true);
      setMessage(null);
      setError(null);

      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
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

      router.push(`/resend_verification?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell>
      <div className="w-full rounded-3xl border border-gold/10 bg-white/70 dark:bg-dark-card/70 backdrop-blur-sm p-4 sm:p-5 space-y-3 shadow-warm">
        <div className="grid grid-cols-2 gap-2 rounded-full bg-parchment dark:bg-dark-bg p-1 border border-gold/10">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage(null);
              setError(null);
            }}
            className={`rounded-full py-2.5 text-sm font-semibold transition-colors ${
              mode === "login"
                ? "bg-gold text-white"
                : "text-muted hover:text-ink dark:hover:text-parchment"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setMessage(null);
              setError(null);
            }}
            className={`rounded-full py-2.5 text-sm font-semibold transition-colors ${
              mode === "signup"
                ? "bg-gold text-white"
                : "text-muted hover:text-ink dark:hover:text-parchment"
            }`}
          >
            Sign up
          </button>
        </div>

        {mode === "signup" ? (
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Full name"
            className="w-full bg-white dark:bg-dark-card border border-gold/10 rounded-full px-4 py-3.5 text-sm text-ink dark:text-parchment placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        ) : null}

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full bg-white dark:bg-dark-card border border-gold/10 rounded-full px-4 py-3.5 text-sm text-ink dark:text-parchment placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
        />

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full bg-white dark:bg-dark-card border border-gold/10 rounded-full px-4 py-3.5 text-sm text-ink dark:text-parchment placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
        />

        {mode === "login" ? (
          <div className="flex items-center justify-between px-1 pt-0.5">
            <Link
              href={
                email.trim()
                  ? `/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`
                  : "/reset-password"
              }
              className="text-xs font-semibold text-gold hover:text-gold/80 transition-colors"
            >
              Forgot password?
            </Link>
            <button
              type="button"
              onClick={handleResendFromLogin}
              disabled={isLoadingCredentials || isResending || !email.trim()}
              className="text-xs font-medium text-muted hover:text-ink dark:hover:text-parchment transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? "Sending verification..." : "Resend verification"}
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleCredentialsSubmit}
          disabled={isLoadingCredentials || isResending}
          className="w-full bg-gold text-white rounded-full py-3.5 text-sm font-semibold shadow-warm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoadingCredentials
            ? mode === "signup"
              ? "Creating account..."
              : "Logging in..."
            : mode === "signup"
              ? "Create account"
              : "Log in"}
        </button>

        {message ? (
          <p className="text-xs text-green-700 text-center rounded-2xl bg-green-50 px-3 py-2 border border-green-100">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-xs text-red-600 text-center rounded-2xl bg-red-50 px-3 py-2 border border-red-100">
            {error}
          </p>
        ) : null}
      </div>
    </AuthShell>
  );
}
