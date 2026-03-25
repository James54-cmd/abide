"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Copy, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BibleVerse } from "@/features/bible/types";

interface BibleVerseItemProps {
  verse: BibleVerse;
  isActive: boolean;
  verseTextClasses: string;
  index: number;
  onToggleActive: (reference: string) => void;
  onOpenNote: (reference: string) => void;
  onCopy: (verse: BibleVerse) => void;
}

export default function BibleVerseItem({
  verse,
  isActive,
  verseTextClasses,
  index,
  onToggleActive,
  onOpenNote,
  onCopy,
}: BibleVerseItemProps) {
  return (
    <motion.div
      key={verse.reference}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index * 0.01, 0.1), duration: 0.15 }}
      onClick={() => onToggleActive(verse.reference)}
      className="group cursor-pointer"
    >
      <div
        className={cn(
          "relative rounded-xl px-3 pt-2 pb-5 -mx-1 transition-colors",
          isActive ? "bg-gold/[0.07] dark:bg-gold/[0.12]" : "hover:bg-gold/[0.04]"
        )}
      >
        <p className={verseTextClasses}>
          <sup className="text-gold font-bold text-[0.65em] mr-1 select-none">{verse.verse}</sup>
          {verse.text}
        </p>

        <AnimatePresence>
          {isActive ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 pt-2 pb-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNote(verse.reference);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink dark:hover:text-parchment bg-white dark:bg-dark-card border border-gold/10 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Note
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(verse);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink dark:hover:text-parchment bg-white dark:bg-dark-card border border-gold/10 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
