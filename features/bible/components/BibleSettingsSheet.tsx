"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenuSelect,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import type {
  Translation,
  FontSize,
  FontFamily,
  LineSpacing,
  BibleBook,
  BibleChapter,
} from "@/features/bible/types";
import { FONT_SIZE_LABELS } from "@/features/bible/types";

interface BibleSettingsSheetProps {
  translation: Translation;
  books: BibleBook[];
  bookId: string;
  chapters: BibleChapter[];
  chapterId: string;
  selectedBook: BibleBook | null;
  selectedChapter: BibleChapter | null;
  fontSize: FontSize;
  fontFamily: FontFamily;
  lineSpacing: LineSpacing;
  verseTextClasses: string;
  onTranslationChange: (v: Translation) => void;
  onBookChange: (v: string) => void;
  onChapterChange: (v: string) => void;
  onFontSizeChange: (v: FontSize) => void;
  onFontFamilyChange: (v: FontFamily) => void;
  onLineSpacingChange: (v: LineSpacing) => void;
  onClose: () => void;
}

export default function BibleSettingsSheet({
  translation,
  books,
  bookId,
  chapters,
  chapterId,
  selectedBook,
  selectedChapter,
  fontSize,
  fontFamily,
  lineSpacing,
  verseTextClasses,
  onTranslationChange,
  onBookChange,
  onChapterChange,
  onFontSizeChange,
  onFontFamilyChange,
  onLineSpacingChange,
  onClose,
}: BibleSettingsSheetProps) {
  return (
    <div className="fixed inset-0 z-[70]" onClick={onClose}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/30" />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 inset-x-0 w-full max-w-[430px] mx-auto rounded-t-3xl bg-white dark:bg-dark-card border-t border-gold/10 max-h-[85dvh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-dark-card pt-3 pb-2 px-5">
          <div className="w-10 h-1 bg-gold/20 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-semibold text-ink dark:text-parchment">Settings</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gold/10">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-8 space-y-6">
          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Bible</h4>
            <div className="space-y-2">
              <DropdownMenuSelect
                value={translation}
                onValueChange={(v) => onTranslationChange(v as Translation)}
                label={translation}
              >
                <DropdownMenuRadioItem value="NIV">NIV</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="NLT">NLT</DropdownMenuRadioItem>
              </DropdownMenuSelect>

              <DropdownMenuSelect
                value={bookId}
                onValueChange={onBookChange}
                label={selectedBook?.name ?? "Book"}
                disabled={books.length === 0}
              >
                {books.map((b) => (
                  <DropdownMenuRadioItem key={b.id} value={b.id}>{b.name}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuSelect>

              <DropdownMenuSelect
                value={chapterId}
                onValueChange={onChapterChange}
                label={selectedChapter ? `Chapter ${selectedChapter.number}` : "Chapter"}
                disabled={chapters.length === 0}
              >
                {chapters.map((c) => (
                  <DropdownMenuRadioItem key={c.id} value={c.id}>Chapter {c.number}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuSelect>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Reading</h4>

            <div>
              <p className="text-xs text-muted mb-2">Text Size</p>
              <div className="grid grid-cols-4 gap-1.5">
                {(["small", "medium", "large", "xlarge"] as FontSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => onFontSizeChange(size)}
                    className={cn(
                      "rounded-lg h-10 text-xs font-semibold transition-all",
                      fontSize === size ? "bg-gold text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-muted"
                    )}
                  >
                    {FONT_SIZE_LABELS[size]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted mb-2">Font</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(["serif", "sans"] as FontFamily[]).map((family) => (
                  <button
                    key={family}
                    onClick={() => onFontFamilyChange(family)}
                    className={cn(
                      "rounded-lg h-10 text-sm transition-all capitalize",
                      family === "serif" ? "font-serif" : "font-sans",
                      fontFamily === family ? "bg-gold text-white shadow-sm font-semibold" : "bg-slate-100 dark:bg-slate-800 text-muted"
                    )}
                  >
                    {family}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted mb-2">Line Spacing</p>
              <div className="grid grid-cols-4 gap-1.5">
                {(["tight", "normal", "relaxed", "loose"] as LineSpacing[]).map((sp) => (
                  <button
                    key={sp}
                    onClick={() => onLineSpacingChange(sp)}
                    className={cn(
                      "rounded-lg h-10 text-[11px] font-medium capitalize transition-all",
                      lineSpacing === sp ? "bg-gold text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-muted"
                    )}
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Preview</h4>
            <div className="rounded-xl border border-gold/10 bg-parchment/50 dark:bg-dark-bg/50 p-3">
              <p className={verseTextClasses}>
                <sup className="text-gold font-bold text-[0.65em] mr-1">1</sup>
                In the beginning God created the heavens and the earth.
              </p>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
