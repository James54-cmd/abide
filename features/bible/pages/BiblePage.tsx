"use client";

import { AnimatePresence, motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/EmptyState";
import BibleVerseItem from "@/features/bible/components/BibleVerseItem";
import BibleSettingsSheet from "@/features/bible/components/BibleSettingsSheet";
import BibleNotesModal from "@/features/bible/components/BibleNotesModal";
import BibleActionBar from "@/features/bible/components/BibleActionBar";
import { useBibleState } from "@/features/bible/hooks/useBibleState";

export default function BiblePage() {
  const state = useBibleState();

  return (
    <PageTransition>
      <div className="bg-parchment dark:bg-dark-bg min-h-screen pb-20">
        <main>
          <div className="px-5 py-6 pb-20">
            {state.error ? (
              <p className="text-xs text-red-600 text-center">{state.error}</p>
            ) : state.isLoading ? (
              <div className="space-y-6 py-2" aria-busy aria-label="Loading chapter">
                <Skeleton className="h-5 w-48 mx-auto rounded-md" />
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-14 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-[95%] rounded-md" />
                    <Skeleton className="h-4 w-[88%] rounded-md" />
                  </div>
                ))}
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
                    const verseNotes = state.notes.filter(n => 
                      verse.verse >= n.verse_start && 
                      verse.verse <= (n.verse_end || n.verse_start)
                    );
                    return (
                      <BibleVerseItem
                        key={verse.reference}
                        verse={verse}
                        isActive={state.selectedVerseIds.includes(verse.reference)}
                        highlightColor={highlight?.color}
                        noteCount={verseNotes.length}
                        verseTextClasses={state.verseTextClasses}
                        index={idx}
                        onToggleActive={(ref) => {
                          state.setSelectedVerseIds(prev => 
                            prev.includes(ref) ? prev.filter(id => id !== ref) : [...prev, ref]
                          );
                        }}
                        onOpenNotes={(ref, verseNum) => state.handleOpenNote(ref, verseNum)}
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
            selectionLabel={state.selectedCitation}
            activeColor={state.activeHighlightColor}
            isFavorited={state.isSelectionFavorited}
            onNote={state.handleNoteAction}
            onCopy={state.handleBulkCopy}
            onHighlight={state.handleBulkHighlight}
            onFavorite={state.handleBulkFavorite}
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
            isEditing={!!state.editingNoteId}
            onNoteDraftChange={state.setNoteDraft}
            onSaveNote={state.handleSaveNote}
            onCancelNote={() => {
              state.setActiveVerseForNote(null);
              state.setActiveVerseNumForNote(null);
              state.setActiveVerseNumEndForNote(null);
              state.setNoteDraft("");
              state.setEditingNoteId(null);
            }}
            onEditNote={state.handleEditNote}
            onDeleteNote={state.handleDeleteNote}
            onClose={() => state.setIsNotesOpen(false)}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
