"use client";

import { useMemo, useRef } from "react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  children,
}: OtpModalProps) {
  const otpInputRef = useRef<HTMLInputElement>(null);
  const otpDigits = useMemo(() => {
    const clean = otpValue.replace(/\D/g, "").slice(0, otpLength);
    return Array.from({ length: otpLength }, (_, idx) => clean[idx] ?? "");
  }, [otpValue, otpLength]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <button type="button" onClick={() => otpInputRef.current?.focus()} className="w-full">
          <div className={`grid gap-2 ${otpLength === 6 ? "grid-cols-6" : "grid-cols-4"}`}>
            {otpDigits.map((digit, index) => (
              <div
                key={`otp-${index}`}
                className="h-11 rounded-xl border border-gold/20 bg-parchment/40 dark:bg-dark-bg/40 flex items-center justify-center text-lg font-semibold text-ink dark:text-parchment"
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
