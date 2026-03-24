"use client";

import { AnimatePresence, motion } from "framer-motion";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { getVerseHighlightTextClass } from "@/features/bible/helpers";
import type { BibleHighlight, BibleVerse } from "@/features/bible/helpers";

type BibleReaderProps = {
  toast: string | null;
  error: string | null;
  isLoading: boolean;
  chapterId: string;
  verses: BibleVerse[];
  selectedVerses: number[];
  highlights: BibleHighlight[];
  verseTextClasses: string;
  onSelectVerse: (verseNumber: number, shiftKey: boolean) => void;
};

export function BibleReader({
  toast,
  error,
  isLoading,
  chapterId,
  verses,
  selectedVerses,
  highlights,
  verseTextClasses,
  onSelectVerse,
}: BibleReaderProps) {
  return (
    <>
      <AnimatePresence mode="wait">
        {toast ? (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="sticky top-0 z-30 flex justify-center py-2"
          >
            <span className="text-xs bg-gold text-white rounded-full px-3 py-1 shadow-sm">{toast}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className={cn("px-5 py-6", selectedVerses.length > 0 ? "pb-28" : "")}>
        {error ? (
          <p className="text-xs text-red-600 text-center">{error}</p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : verses.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={chapterId}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {verses.map((verse, idx) => {
                const isActive = selectedVerses.includes(verse.verse);
                const highlightTextClass = getVerseHighlightTextClass(verse.verse, highlights);
                return (
                  <motion.div
                    key={verse.reference}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.01, 0.1), duration: 0.15 }}
                    onClick={(e) => onSelectVerse(verse.verse, e.shiftKey)}
                    className="group cursor-pointer"
                  >
                    <div
                      className={cn(
                        "relative rounded-xl px-3 pt-2 pb-5 -mx-1 transition-colors",
                        isActive ? "bg-gold/[0.03] dark:bg-gold/[0.07]" : "hover:bg-gold/[0.04]"
                      )}
                    >
                      <p className={verseTextClasses}>
                        <sup className="text-gold font-bold text-[0.65em] mr-1 select-none">{verse.verse}</sup>
                        <span
                          className={cn(
                            "rounded px-0.5 decoration-2 underline-offset-4",
                            highlightTextClass,
                            isActive && "underline decoration-dotted decoration-gold"
                          )}
                        >
                          {verse.text}
                        </span>
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        ) : (
          <EmptyState className="pt-10" title="Open your Bible" description="Pick a translation, book, and chapter above." />
        )}
      </div>
    </>
  );
}
