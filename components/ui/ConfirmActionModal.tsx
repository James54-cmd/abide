"use client";

import { useEffect, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmActionModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  isConfirming?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmActionModal({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (isConfirming) return;
      onCancel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isConfirming, isOpen, onCancel]);

  async function handleConfirm() {
    await onConfirm();
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="confirm-action-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          onClick={() => {
            if (isConfirming) return;
            onCancel();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
        >
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[400px] rounded-2xl bg-white dark:bg-dark-card border border-gold/10 shadow-lg overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {danger ? (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-red-500/10 text-red-500 border border-red-500/15">
                      <AlertTriangle className="w-4 h-4" strokeWidth={2} />
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gold/10 text-gold border border-gold/15">
                      <span className="w-2 h-2 rounded-full bg-gold/70" />
                    </span>
                  )}

                  <h3
                    id={titleId}
                    className="font-serif text-lg font-semibold text-ink dark:text-parchment truncate"
                  >
                    {title}
                  </h3>
                </div>

                {description ? (
                  <p id={descId} className="mt-2 text-sm text-muted">
                    {description}
                  </p>
                ) : null}
              </div>

              <button
                onClick={() => {
                  if (isConfirming) return;
                  onCancel();
                }}
                className="p-1.5 rounded-lg hover:bg-gold/10 text-muted"
                aria-label="Close modal"
                type="button"
                disabled={isConfirming}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-5">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (isConfirming) return;
                    onCancel();
                  }}
                  className="flex-1 border-gold/20 text-muted"
                  disabled={isConfirming}
                >
                  {cancelText}
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    await handleConfirm();
                  }}
                  disabled={isConfirming}
                  className={
                    danger
                      ? "flex-1 bg-red-500 hover:bg-red-500/90 text-white border-0"
                      : "flex-1"
                  }
                >
                  {isConfirming ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/80 border-t-white animate-spin" />
                    </span>
                  ) : (
                    confirmText
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

