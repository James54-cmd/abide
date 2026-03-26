"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);
      setError(null);

      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      setMessage("Password updated. Redirecting to login...");
      setTimeout(() => {
        router.replace("/login?message=Password%20updated.%20Please%20log%20in.");
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="w-full space-y-4">
        <h2 className="text-2xl font-serif font-semibold text-ink dark:text-parchment text-center">
          Reset password
        </h2>
        <p className="text-sm text-muted text-center">
          Enter a new password for your account.
        </p>

        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="New password"
          className="w-full bg-white dark:bg-dark-card border border-gold/10 rounded-full px-4 py-3.5 text-sm text-ink dark:text-parchment placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
        />

        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm new password"
          className="w-full bg-white dark:bg-dark-card border border-gold/10 rounded-full px-4 py-3.5 text-sm text-ink dark:text-parchment placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30"
        />

        <button
          onClick={handleReset}
          disabled={isLoading}
          className="w-full bg-gold text-white rounded-full py-3.5 text-sm font-semibold shadow-warm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Updating password..." : "Set new password"}
        </button>

        {message ? <p className="text-xs text-green-700 text-center">{message}</p> : null}
        {error ? <p className="text-xs text-red-600 text-center">{error}</p> : null}
      </div>
    </AuthShell>
  );
}
