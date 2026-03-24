"use client";

import { Copy, Highlighter, MessageSquare, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HIGHLIGHT_COLORS, type HighlightColor } from "@/features/bible/helpers";

type HighlightBarProps = {
  selectedRange: { start: number; end: number } | null;
  selectedHighlightColor: HighlightColor;
  onClearSelection: () => void;
  onCopy: () => void;
  onHighlight: () => void;
  onRemoveHighlight: () => void;
  onOpenNote: () => void;
  onSelectColor: (color: HighlightColor) => void;
};

export function HighlightBar({
  selectedRange,
  selectedHighlightColor,
  onClearSelection,
  onCopy,
  onHighlight,
  onRemoveHighlight,
  onOpenNote,
  onSelectColor,
}: HighlightBarProps) {
  return (
    <AnimatePresence>
      {selectedRange ? (
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-4 inset-x-0 z-[60] px-4"
        >
          <div className="mx-auto w-full max-w-[430px] rounded-2xl border border-gold/25 bg-white/95 dark:bg-dark-card/95 backdrop-blur-md shadow-lg px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted">
                {selectedRange.start === selectedRange.end
                  ? `Verse ${selectedRange.start} selected`
                  : `Verses ${selectedRange.start}-${selectedRange.end} selected`}
              </p>
              <button
                onClick={onClearSelection}
                className="text-sm text-muted hover:text-ink dark:hover:text-parchment transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={onCopy}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink dark:text-parchment bg-white dark:bg-dark-card border border-gold/15 rounded-xl px-3 py-2 transition-colors hover:bg-gold/[0.06]"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={onHighlight}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink dark:text-parchment bg-white dark:bg-dark-card border border-gold/15 rounded-xl px-3 py-2 transition-colors hover:bg-gold/[0.06]"
              >
                <Highlighter className="w-4 h-4" />
                Highlight
              </button>
              <button
                onClick={onRemoveHighlight}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink dark:text-parchment bg-white dark:bg-dark-card border border-gold/15 rounded-xl px-3 py-2 transition-colors hover:bg-gold/[0.06]"
              >
                <X className="w-4 h-4" />
                Remove
              </button>
              <button
                onClick={onOpenNote}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink dark:text-parchment bg-white dark:bg-dark-card border border-gold/15 rounded-xl px-3 py-2 transition-colors hover:bg-gold/[0.06]"
              >
                <MessageSquare className="w-4 h-4" />
                Note
              </button>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <p className="text-[11px] text-muted">Color</p>
              <div className="flex items-center gap-1.5">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.key}
                    onClick={() => onSelectColor(color.key)}
                    aria-label={`Highlight color ${color.key}`}
                    className={cn(
                      "w-5 h-5 rounded-full border transition-all",
                      color.chipClass,
                      selectedHighlightColor === color.key
                        ? "border-ink dark:border-parchment ring-2 ring-gold/35"
                        : "border-white/80 dark:border-dark-bg"
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
