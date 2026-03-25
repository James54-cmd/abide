"use client";

import { AnimatePresence, motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import EmptyState from "@/components/ui/EmptyState";
import BibleVerseItem from "@/features/bible/components/BibleVerseItem";
import BibleSettingsSheet from "@/features/bible/components/BibleSettingsSheet";
import BibleNotesModal from "@/features/bible/components/BibleNotesModal";
import { useBibleState } from "@/features/bible/hooks/useBibleState";

export default function BiblePage() {
  const state = useBibleState();

  return (
    <PageTransition>
      <div className="bg-parchment dark:bg-dark-bg">
        <main>
          <AnimatePresence mode="wait">
            {state.toast ? (
              <motion.div
                key="toast"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="sticky top-0 z-30 flex justify-center py-2"
              >
                <span className="text-xs bg-gold text-white rounded-full px-3 py-1 shadow-sm">{state.toast}</span>
              </motion.div>
            ) : null}
          </AnimatePresence>

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
                  {state.verses.map((verse, idx) => (
                    <BibleVerseItem
                      key={verse.reference}
                      verse={verse}
                      isActive={state.activeVerseId === verse.reference}
                      verseTextClasses={state.verseTextClasses}
                      index={idx}
                      onToggleActive={(ref) =>
                        state.setActiveVerseId(state.activeVerseId === ref ? null : ref)
                      }
                      onOpenNote={state.handleOpenNote}
                      onCopy={state.handleCopy}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            ) : (
              <EmptyState className="pt-10" title="Open your Bible" description="Pick a translation, book, and chapter above." />
            )}
          </div>
        </main>
      </div>

      {state.isNavSheetOpen ? (
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
          onTranslationChange={state.handleTranslationChange}
          onBookChange={state.handleBookChange}
          onChapterChange={state.handleChapterChange}
          onFontSizeChange={state.setFontSize}
          onFontFamilyChange={state.setFontFamily}
          onLineSpacingChange={state.setLineSpacing}
          onClose={() => state.setIsNavSheetOpen(false)}
        />
      ) : null}

      {state.isNotesOpen ? (
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
      ) : null}
    </PageTransition>
  );
}
