import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { X, BookOpen } from "lucide-react";
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
  BibleVerse,
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
  verses: BibleVerse[];
  activeVerseId: string | null;
  onTranslationChange: (v: Translation) => void;
  onBookChange: (v: string) => void;
  onChapterChange: (v: string) => void;
  onVerseChange: (v: string) => void;
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
  verses,
  activeVerseId,
  onTranslationChange,
  onBookChange,
  onChapterChange,
  onVerseChange,
  onFontSizeChange,
  onFontFamilyChange,
  onLineSpacingChange,
  onClose,
}: BibleSettingsSheetProps) {
  const [testamentTab, setTestamentTab] = useState<"OT" | "NT">("OT");

  useEffect(() => {
    if (selectedBook?.testament) {
      setTestamentTab(selectedBook.testament);
    }
  }, [selectedBook?.id, selectedBook?.testament]);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => b.testament === testamentTab);
  }, [books, testamentTab]);

  return (
    <div className="fixed inset-0 z-[100] flex justify-center">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" 
      />
      
      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 350, mass: 0.8 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.05, bottom: 0.8 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 150 || info.velocity.y > 800) {
            onClose();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 w-full max-w-[430px] rounded-t-[32px] bg-white dark:bg-dark-card border-t border-gold/10 shadow-2xl max-h-[92dvh] overflow-hidden flex flex-col"
      >
        {/* Handle & Header */}
        <div className="bg-white dark:bg-dark-card pt-3 pb-2 px-6 flex-shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-gold/20 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold text-ink dark:text-parchment">Settings</h3>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-gold/10 transition-colors"
            >
              <X className="w-5 h-5 text-muted" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-12 space-y-8 overflow-y-auto overscroll-contain">
          <section className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
              <h4 className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">Bible Reference</h4>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted/60 uppercase px-1">Translation</p>
                <DropdownMenuSelect
                  value={translation}
                  onValueChange={(v) => onTranslationChange(v as Translation)}
                  label={translation}
                >
                  <DropdownMenuRadioItem value="NIV">NIV</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="NLT">NLT</DropdownMenuRadioItem>
                </DropdownMenuSelect>
              </div>

              {/* Testament Tabs */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-muted/60 uppercase px-1">Testament</p>
                <div className="flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl">
                  {(["OT", "NT"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTestamentTab(t)}
                      className={cn(
                        "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                        testamentTab === t 
                          ? "bg-white dark:bg-slate-800 shadow-sm text-gold" 
                          : "text-muted hover:text-ink dark:hover:text-parchment"
                      )}
                    >
                      {t === "OT" ? "Old Testament" : "New Testament"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted/60 uppercase px-1">Book</p>
                  <DropdownMenuSelect
                    value={bookId}
                    onValueChange={onBookChange}
                    label={
                      selectedBook?.testament === testamentTab 
                        ? selectedBook.name 
                        : `Pick a Book`
                    }
                    disabled={books.length === 0}
                  >
                    {filteredBooks.map((b) => (
                      <DropdownMenuRadioItem key={b.id} value={b.id}>{b.name}</DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuSelect>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted/60 uppercase px-1">Chapter</p>
                  <DropdownMenuSelect
                    value={chapterId}
                    onValueChange={onChapterChange}
                    label={selectedChapter ? `${selectedChapter.number}` : "Ch."}
                    disabled={chapters.length === 0}
                  >
                    {chapters.map((c) => (
                      <DropdownMenuRadioItem key={c.id} value={c.id}>Chapter {c.number}</DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuSelect>
                </div>
              </div>

              {/* Verse Selection */}
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted/60 uppercase px-1">Verse</p>
                <DropdownMenuSelect
                  value={activeVerseId || ""}
                  onValueChange={(v) => {
                    onVerseChange(v);
                    onClose();
                  }}
                  label={activeVerseId ? `Verse ${activeVerseId.split(':').pop()}` : "Pick a Verse"}
                  disabled={verses.length === 0}
                >
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {verses.map((v) => (
                      <button
                        key={v.reference}
                        onClick={() => {
                          onVerseChange(v.reference);
                          onClose();
                        }}
                        className={cn(
                          "h-10 rounded-lg text-xs font-semibold transition-all hover:bg-gold/10",
                          activeVerseId === v.reference ? "bg-gold text-white shadow-sm" : "bg-slate-50 dark:bg-slate-800/50 text-muted"
                        )}
                      >
                        {v.verse}
                      </button>
                    ))}
                  </div>
                </DropdownMenuSelect>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
              <h4 className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">Appearance</h4>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted mb-3 flex justify-between items-center">
                <span>Text Size</span>
                <span className="text-[10px] font-normal opacity-60">{fontSize}</span>
              </p>
              <div className="grid grid-cols-4 gap-2">
                {(["small", "medium", "large", "xlarge"] as FontSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => onFontSizeChange(size)}
                    className={cn(
                      "rounded-xl h-11 text-xs font-semibold transition-all border-2",
                      fontSize === size 
                        ? "bg-gold border-gold text-white shadow-md shadow-gold/20" 
                        : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-muted hover:border-gold/30"
                    )}
                  >
                    {FONT_SIZE_LABELS[size]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted mb-3">Typography</p>
              <div className="grid grid-cols-2 gap-3">
                {(["serif", "sans"] as FontFamily[]).map((family) => (
                  <button
                    key={family}
                    onClick={() => onFontFamilyChange(family)}
                    className={cn(
                      "rounded-xl h-12 text-sm transition-all capitalize border-2",
                      family === "serif" ? "font-serif" : "font-sans",
                      fontFamily === family 
                        ? "bg-gold border-gold text-white shadow-md shadow-gold/20 font-bold" 
                        : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-muted hover:border-gold/30"
                    )}
                  >
                    {family}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted mb-3">Line Spacing</p>
              <div className="grid grid-cols-4 gap-2">
                {(["tight", "normal", "relaxed", "loose"] as LineSpacing[]).map((sp) => (
                  <button
                    key={sp}
                    onClick={() => onLineSpacingChange(sp)}
                    className={cn(
                      "rounded-xl h-11 text-[10px] font-semibold capitalize transition-all border-2",
                      lineSpacing === sp 
                        ? "bg-gold border-gold text-white shadow-md shadow-gold/20" 
                        : "bg-slate-50 dark:bg-slate-800/50 border-transparent text-muted hover:border-gold/30"
                    )}
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
              <h4 className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">Preview</h4>
            </div>
            <div className="rounded-2xl border border-gold/20 bg-gold/5 dark:bg-gold/5 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <div className="font-serif text-4xl italic">Aa</div>
              </div>
              <p className={cn(verseTextClasses, "relative z-10")}>
                <sup className="text-gold font-black text-[0.65em] mr-1.5 shadow-sm">1</sup>
                In the beginning God created the heavens and the earth.
              </p>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
