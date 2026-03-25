"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Copy, MessageSquare, Highlighter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BibleVerse } from "@/features/bible/types";

interface BibleVerseItemProps {
  verse: BibleVerse;
  isActive: boolean;
  highlightColor?: string | null;
  noteCount?: number;
  verseTextClasses: string;
  index: number;
  onToggleActive: (reference: string) => void;
  onOpenNotes: (reference: string, verseNum: number) => void;
}

export default function BibleVerseItem({
  verse,
  isActive,
  highlightColor,
  noteCount,
  verseTextClasses,
  index,
  onToggleActive,
  onOpenNotes,
}: BibleVerseItemProps) {
  return (
    <motion.div
      key={verse.reference}
      id={`verse-${verse.reference.replace(/[:\s]/g, "-")}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(index * 0.01, 0.1), duration: 0.15 }}
      onClick={() => onToggleActive(verse.reference)}
      className="group cursor-pointer"
    >
      <div
        className={cn(
          "relative rounded-xl px-3 pt-1 pb-1 -mx-1 transition-colors hover:bg-gold/[0.04]"
        )}
      >
        <p className={cn(
          verseTextClasses,
          isActive && "underline decoration-gold decoration-dotted underline-offset-4 decoration-2"
        )}>
          <sup className="text-gold font-bold text-[0.65em] mr-1 select-none inline-flex items-center gap-1 leading-none">
            {verse.verse}
            {noteCount && noteCount > 0 ? (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenNotes(verse.reference, verse.verse);
                }}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gold/15 text-gold-700 dark:text-gold-400 font-bold border border-gold/10 transform -translate-y-[1px] hover:bg-gold/30 transition-colors pointer-events-auto cursor-help"
              >
                <MessageSquare className="w-2.5 h-2.5" />
                <span className="text-[0.85em]">{noteCount}</span>
              </span>
            ) : null}
          </sup>
          <span className={cn(
            highlightColor && "box-decoration-clone rounded px-1 py-[2px] -mx-1 transition-colors duration-300",
            highlightColor === 'gold' && "bg-amber-200 dark:bg-amber-500/40",
            highlightColor === 'green' && "bg-emerald-200 dark:bg-emerald-500/40",
            highlightColor === 'blue' && "bg-sky-200 dark:bg-sky-500/40",
            highlightColor === 'rose' && "bg-rose-200 dark:bg-rose-500/40",
            highlightColor === 'purple' && "bg-purple-200 dark:bg-purple-500/40"
          )}>
            {verse.text}
          </span>
        </p>
      </div>  
    </motion.div>
  );
}
