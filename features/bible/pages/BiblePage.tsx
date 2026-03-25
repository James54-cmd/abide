"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import EmptyState from "@/components/ui/EmptyState";
import BibleVerseItem from "@/features/bible/components/BibleVerseItem";
import BibleSettingsSheet from "@/features/bible/components/BibleSettingsSheet";
import BibleNotesModal from "@/features/bible/components/BibleNotesModal";
import BibleActionBar from "@/features/bible/components/BibleActionBar";
import { useBibleState } from "@/features/bible/hooks/useBibleState";
import { getActiveHighlightColor, getFormattedSelectionCitation } from "@/features/bible/utils";

export default function BiblePage() {
  const state = useBibleState();

  const handleNoteAction = () => {
    if (state.selectedVerseIds.length === 0) return;
    const firstRef = state.selectedVerseIds[0];
    const verseNum = state.verses.find(v => v.reference === firstRef)?.verse ?? 1;
    state.handleOpenNote(firstRef, verseNum);
  };

  const activeHighlightColor = getActiveHighlightColor(
    state.selectedVerseIds,
    state.verses,
    state.highlights
  );

  const selectedCitation = getFormattedSelectionCitation(
    state.selectedVerseIds,
    state.verses,
    state.selectedBook?.name ?? "Bible",
    state.selectedChapter?.number ?? "",
    state.translation
  );

  useEffect(() => {
    if (state.selectedVerseIds.length === 1 && !state.isLoading) {
      const ref = state.selectedVerseIds[0];
      const sanitized = ref.replace(/[:\s]/g, "-");
      const timer = setTimeout(() => {
        const el = document.getElementById(`verse-${sanitized}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [state.selectedVerseIds, state.isLoading]);

  return (
    <PageTransition>
      <div className="bg-parchment dark:bg-dark-bg min-h-screen pb-20">
        <main>
          <div className="px-5 py-6">
            {state.error ? (
              <p className="text-xs text-red-600 text-center">{state.error}</p>
            ) : state.isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              </div>
            ) : state.verses.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={state.chapterId}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {state.verses.map((verse, idx) => {
                    const highlight = state.highlights.find(h => h.verse_start === verse.verse);
                    const note = state.notes.find(n => n.verse_start === verse.verse);
                    return (
                      <BibleVerseItem
                        key={verse.reference}
                        verse={verse}
                        isActive={state.selectedVerseIds.includes(verse.reference)}
                        highlightColor={highlight?.color}
                        hasNote={!!note}
                        verseTextClasses={state.verseTextClasses}
                        index={idx}
                        onToggleActive={(ref) => {
                          state.setSelectedVerseIds(prev => 
                            prev.includes(ref) ? prev.filter(id => id !== ref) : [...prev, ref]
                          );
                        }}
                      />
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            ) : (
              <EmptyState className="pt-10" title="Open your Bible" description="Pick a translation, book, and chapter above." />
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {state.selectedVerseIds.length > 0 && (
          <BibleActionBar
            selectionLabel={selectedCitation}
            activeColor={activeHighlightColor}
            onNote={handleNoteAction}
            onCopy={state.handleBulkCopy}
            onHighlight={state.handleBulkHighlight}
            onClear={() => state.setSelectedVerseIds([])}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.isNavSheetOpen && (
          <BibleSettingsSheet
            translation={state.translation}
            books={state.books}
            bookId={state.bookId}
            chapters={state.chapters}
            chapterId={state.chapterId}
            selectedBook={state.selectedBook}
            selectedChapter={state.selectedChapter}
            fontSize={state.fontSize}
            fontFamily={state.fontFamily}
            lineSpacing={state.lineSpacing}
            verseTextClasses={state.verseTextClasses}
            verses={state.verses}
            activeVerseId={state.selectedVerseIds[0] || null}
            onTranslationChange={state.handleTranslationChange}
            onBookChange={state.handleBookChange}
            onChapterChange={state.handleChapterChange}
            onVerseChange={(ref) => {
              state.setSelectedVerseIds([ref]);
            }}
            onFontSizeChange={state.setFontSize}
            onFontFamilyChange={state.setFontFamily}
            onLineSpacingChange={state.setLineSpacing}
            onClose={() => state.setIsNavSheetOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.isNotesOpen && (
          <BibleNotesModal
            notes={state.notes}
            activeVerseForNote={state.activeVerseForNote}
            noteDraft={state.noteDraft}
            onNoteDraftChange={state.setNoteDraft}
            onSaveNote={state.handleSaveNote}
            onCancelNote={() => {
              state.setActiveVerseForNote(null);
              state.setNoteDraft("");
            }}
            onDeleteNote={state.handleDeleteNote}
            onClose={() => state.setIsNotesOpen(false)}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
