"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHAKE_MS = 450;
const CLEAR_DELAY_MS = 380;

type OtpModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  otpValue: string;
  onOtpChange: (value: string) => void;
  onConfirm: () => void;
  onResend: () => void;
  isConfirming?: boolean;
  isResending?: boolean;
  isBusy?: boolean;
  canResend?: boolean;
  resendLabel?: string;
  otpLength?: number;
  confirmLabel?: string;
  verifyingLabel?: string;
  helperText?: string;
  invalidAttemptToken?: number;
  clearOtpOnInvalid?: boolean;
  children?: ReactNode;
};

export default function OtpModal({
  open,
  onOpenChange,
  title,
  description,
  otpValue,
  onOtpChange,
  onConfirm,
  onResend,
  isConfirming = false,
  isResending = false,
  isBusy = false,
  canResend = true,
  resendLabel = "Send code again",
  otpLength = 6,
  confirmLabel = "Confirm",
  verifyingLabel = "Verifying...",
  helperText,
  invalidAttemptToken,
  clearOtpOnInvalid = true,
  children,
}: OtpModalProps) {
  const otpInputRef = useRef<HTMLInputElement>(null);
  const prevInvalidTokenRef = useRef(0);
  const [isErrorFlash, setIsErrorFlash] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const otpDigits = useMemo(() => {
    const clean = otpValue.replace(/\D/g, "").slice(0, otpLength);
    return Array.from({ length: otpLength }, (_, idx) => clean[idx] ?? "");
  }, [otpValue, otpLength]);

  useEffect(() => {
    if (invalidAttemptToken === undefined) return;
    if (invalidAttemptToken === 0) {
      prevInvalidTokenRef.current = 0;
      return;
    }
    if (invalidAttemptToken <= prevInvalidTokenRef.current) return;
    prevInvalidTokenRef.current = invalidAttemptToken;

    setIsErrorFlash(true);
    setIsShaking(true);
    const shakeTimer = window.setTimeout(() => setIsShaking(false), SHAKE_MS);

    const clearTimer = window.setTimeout(() => {
      if (clearOtpOnInvalid) {
        onOtpChange("");
      }
      setIsErrorFlash(false);
      otpInputRef.current?.focus();
    }, CLEAR_DELAY_MS);

    return () => {
      window.clearTimeout(shakeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [invalidAttemptToken, clearOtpOnInvalid, onOtpChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <button type="button" onClick={() => otpInputRef.current?.focus()} className="w-full">
          <div
            className={`grid gap-2 ${otpLength === 6 ? "grid-cols-6" : "grid-cols-4"} ${
              isShaking ? "animate-otp-shake" : ""
            }`}
          >
            {otpDigits.map((digit, index) => (
              <div
                key={`otp-${index}`}
                className={`h-11 rounded-xl flex items-center justify-center text-lg font-semibold text-ink dark:text-parchment transition-[box-shadow,border-color,background-color] duration-200 ${
                  isErrorFlash
                    ? "border-2 border-red-500 dark:border-red-400 bg-red-50/90 dark:bg-red-950/35 shadow-[0_0_0_1px_rgba(239,68,68,0.35)]"
                    : "border border-gold/20 bg-parchment/40 dark:bg-dark-bg/40"
                }`}
              >
                {digit}
              </div>
            ))}
          </div>
        </button>

        <input
          ref={otpInputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={otpValue.replace(/\D/g, "").slice(0, otpLength)}
          onChange={(event) => onOtpChange(event.target.value.replace(/\D/g, "").slice(0, otpLength))}
          className="sr-only"
          aria-label="OTP code"
          aria-invalid={isErrorFlash}
        />

        {children}

        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming || isBusy}
          className="w-full rounded-full bg-gold text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {isConfirming ? verifyingLabel : confirmLabel}
        </button>

        <p className="text-xs text-center text-muted">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={onResend}
            disabled={isResending || isBusy || !canResend}
            className="font-semibold text-gold hover:text-gold/80 disabled:opacity-60"
          >
            {resendLabel}
          </button>
        </p>

        {helperText ? (
          <div className="rounded-xl border border-gold/10 bg-gold/5 px-3 py-2 text-center">
            <p className="text-xs italic text-muted">{helperText}</p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
