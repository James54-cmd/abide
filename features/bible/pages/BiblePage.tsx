"use client";

import PageTransition from "@/components/PageTransition";
import { BibleReader } from "@/features/bible/components/BibleReader";
import { BibleSettingsSheet } from "@/features/bible/components/BibleSettingsSheet";
import { HighlightBar } from "@/features/bible/components/HighlightBar";
import { NotesModal } from "@/features/bible/components/NotesModal";
import { useBibleReaderState } from "@/features/bible/hooks/useBibleReaderState";
import type { Translation } from "@/features/bible/types";

export default function BiblePage() {
  const s = useBibleReaderState();

  return (
    <PageTransition>
      <div className="bg-parchment dark:bg-dark-bg">
        <main>
          <BibleReader
            toast={s.toast}
            error={s.error}
            isLoading={s.isLoading}
            chapterId={s.chapterId}
            verses={s.verses}
            selectedVerses={s.selectedVerses}
            highlights={s.highlights}
            verseTextClasses={s.verseTextClasses}
            selectedRange={s.selectedRange}
            onSelectVerse={s.handleSelectVerse}
          />
        </main>
      </div>

      <HighlightBar
        selectedRange={s.selectedRange}
        selectedHighlightColor={s.selectedHighlightColor}
        onClearSelection={() => {
          s.setSelectedVerses([]);
          s.setSelectionAnchor(null);
        }}
        onCopy={() => void s.handleCopySelected()}
        onHighlight={() => void s.handleSaveHighlight()}
        onRemoveHighlight={s.handleRemoveHighlight}
        onOpenNote={() => {
          s.setIsNotesOpen(true);
          s.setIsCreatingNote(true);
        }}
        onSelectColor={(color) => {
          s.setSelectedHighlightColor(color);
          if (s.selectedRange) {
            void s.handleSaveHighlight(color);
          }
        }}
      />

      <BibleSettingsSheet
        open={s.isNavSheetOpen}
        onClose={() => s.setIsNavSheetOpen(false)}
        translation={s.translation}
        bookId={s.bookId}
        chapterId={s.chapterId}
        books={s.books}
        chapters={s.chapters}
        selectedBookName={s.selectedBook?.name ?? null}
        selectedChapterNumber={s.selectedChapter?.number ?? null}
        fontSize={s.fontSize}
        fontFamily={s.fontFamily}
        lineSpacing={s.lineSpacing}
        verseTextClasses={s.verseTextClasses}
        onTranslationChange={(v) =>
          void s.loadBibleBootstrap({
            translation: v as Translation,
            preferredBookId: null,
            preferredChapterId: null,
          })
        }
        onBookChange={(id) =>
          void s.loadBibleBootstrap({
            translation: s.translation,
            preferredBookId: id,
            preferredChapterId: null,
          })
        }
        onChapterChange={(id) =>
          void s.loadBibleBootstrap({
            translation: s.translation,
            preferredBookId: s.bookId,
            preferredChapterId: id,
          })
        }
        onFontSizeChange={s.setFontSize}
        onFontFamilyChange={s.setFontFamily}
        onLineSpacingChange={s.setLineSpacing}
      />

      <NotesModal
        open={s.isNotesOpen}
        onClose={() => s.setIsNotesOpen(false)}
        isCreatingNote={s.isCreatingNote}
        notes={s.notes}
        noteDraft={s.noteDraft}
        onNoteDraftChange={s.setNoteDraft}
        onSaveNote={s.handleSaveNote}
        onCancelCreate={() => {
          s.setIsCreatingNote(false);
          s.setNoteDraft("");
        }}
        onDeleteNote={s.handleDeleteNote}
        selectedRange={s.selectedRange}
      />
    </PageTransition>
  );
}
