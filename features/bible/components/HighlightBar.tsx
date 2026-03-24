"use client";

import type { ReactNode } from "react";
import { Copy, MessageSquare } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  formatVerseSelectionLabel,
  HIGHLIGHT_COLORS,
  type HighlightColor,
  type SelectedRange,
} from "@/features/bible/helpers";

type HighlightBarProps = {
  selectedRange: SelectedRange | null;
  selectedVerseCount: number;
  selectedHighlightColor: HighlightColor;
  onClearSelection: () => void;
  onCopy: () => void;
  onOpenNote: () => void;
  onSelectColor: (color: HighlightColor) => void;
};

export function HighlightBar({
  selectedRange,
  selectedVerseCount,
  selectedHighlightColor,
  onClearSelection,
  onCopy,
  onOpenNote,
  onSelectColor,
}: HighlightBarProps) {
  return (
    <AnimatePresence>
      {selectedRange ? (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed bottom-5 inset-x-0 z-[60] px-4 pointer-events-none"
        >
          <div className="pointer-events-auto mx-auto w-full max-w-[420px] rounded-2xl border border-gold/20 bg-white/96 dark:bg-dark-card/96 backdrop-blur-lg shadow-xl shadow-black/[0.08] px-4 py-3.5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11.5px] font-medium tracking-wide text-muted uppercase line-clamp-2">
                {formatVerseSelectionLabel(selectedRange, selectedVerseCount)}
              </span>
              <button
                type="button"
                onClick={onClearSelection}
                className="shrink-0 text-[11.5px] font-medium text-muted hover:text-ink dark:hover:text-parchment transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="h-px bg-gold/10 mb-3" />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <ActionButton onClick={onCopy} icon={<Copy className="w-3.5 h-3.5" />} label="Copy" />
                <ActionButton
                  onClick={onOpenNote}
                  icon={<MessageSquare className="w-3.5 h-3.5" />}
                  label="Note"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.key}
                    type="button"
                    onClick={() => onSelectColor(color.key)}
                    aria-label={`Highlight ${color.key}`}
                    className={cn(
                      "w-5 h-5 rounded-full border-[1.5px] transition-all duration-150",
                      color.chipClass,
                      selectedHighlightColor === color.key
                        ? "border-ink dark:border-parchment scale-110 ring-2 ring-gold/30"
                        : "border-white/70 dark:border-dark-bg scale-100 hover:scale-105"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink dark:text-parchment bg-transparent border border-gold/15 rounded-lg px-2.5 py-1.5 transition-all duration-150 hover:bg-gold/[0.07] hover:border-gold/25 active:scale-95"
    >
      {icon}
      {label}
    </button>
  );
}
