"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { loginWithGraphql, signUpWithGraphql } from "@/lib/graphql/auth";
import { getSafeAuthRedirectUrl } from "@/lib/auth/redirect";
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
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        const result = await signUpWithGraphql({
          fullName: fullName.trim(),
          email,
          password,
          redirectTo,
        });

        if (result.success) {
          // Store credentials temporarily for auto-login on verification
          sessionStorage.setItem("abide_pending_email", email);
          sessionStorage.setItem("abide_pending_password", password);

          if (result.accessToken && result.refreshToken) {
            const supabase = getSupabaseBrowserClient();
            await supabase.auth.setSession({
              access_token: result.accessToken,
              refresh_token: result.refreshToken,
            });
          }
          router.push(`/verify?email=${encodeURIComponent(email)}`);
          return;
        }

        setMessage(result.message ?? "Account created. Please check your email to confirm your signup.");
        return;
      }

      const result = await loginWithGraphql({
        email,
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
      setError(
        err instanceof Error ? err.message : `Unable to ${mode === "signup" ? "sign up" : "log in"}.`
      );
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  return (
    <AuthShell>
      <div className="w-full space-y-3">
        <div className="grid grid-cols-2 gap-2 rounded-full bg-white dark:bg-dark-card p-1 border border-gold/10">
          <button
            onClick={() => {
              setMode("signup");
              setMessage(null);
              setError(null);
            }}
            className={`rounded-full py-2 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-gold text-white"
                : "text-muted hover:text-ink dark:hover:text-parchment"
            }`}
          >
            Sign up
          </button>
          <button
            onClick={() => {
              setMode("login");
              setMessage(null);
              setError(null);
            }}
            className={`rounded-full py-2 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-gold text-white"
                : "text-muted hover:text-ink dark:hover:text-parchment"
            }`}
          >
            Log in
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

        <button
          onClick={handleCredentialsSubmit}
          disabled={isLoadingCredentials}
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

        {message ? <p className="text-xs text-green-700 text-center">{message}</p> : null}
        {error ? <p className="text-xs text-red-600 text-center">{error}</p> : null}
      </div>
    </AuthShell>
  );
}
