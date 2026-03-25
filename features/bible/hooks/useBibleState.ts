"use client";

import { useEffect, useRef } from "react";
import { getAccessToken } from "@/lib/supabase";
import { saveBibleProgress } from "@/lib/graphql/bible/hooks";
import type { BibleProgress } from "@/features/bible/types";
import { useBibleNavigation } from "@/features/bible/hooks/useBibleNavigation";
import { useBiblePreferences } from "@/features/bible/hooks/useBiblePreferences";
import { useBibleAnnotations } from "@/features/bible/hooks/useBibleAnnotations";

const PROGRESS_KEY = "abide_bible_progress";

export function useBibleState() {
  const nav = useBibleNavigation();
  const prefs = useBiblePreferences(nav.serverProgress);
  const annotations = useBibleAnnotations({
    translation: nav.translation,
    bookId: nav.bookId,
    chapterId: nav.chapterId,
    verses: nav.verses,
    selectedVerseIds: nav.selectedVerseIds,
    setSelectedVerseIds: nav.setSelectedVerseIds,
    selectedBook: nav.selectedBook,
    selectedChapter: nav.selectedChapter,
    chapterLabel: nav.chapterLabel,
    isBootstrapped: nav.isBootstrapped,
    isLoading: nav.isLoading,
  });

  // Cross-cutting: persist reading progress locally + to server (Rule 12: useRef, not module let)
  const lastSavedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!nav.isBootstrapped || !nav.bookId || !nav.chapterId) return;

    const lastSelectedId = nav.selectedVerseIds[nav.selectedVerseIds.length - 1];
    const activeVerseNumber =
      nav.verses.find((v) => v.reference === lastSelectedId)?.verse ?? 1;

    const progress: BibleProgress = {
      translation: nav.translation,
      bookId: nav.bookId,
      chapterId: nav.chapterId,
      verse: activeVerseNumber,
      fontSize: prefs.fontSize,
      fontFamily: prefs.fontFamily,
      lineSpacing: prefs.lineSpacing,
    };

    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));

    const saveKey = `${progress.translation}|${progress.bookId}|${progress.chapterId}|${progress.verse}|${prefs.fontSize}|${prefs.fontFamily}|${prefs.lineSpacing}`;
    if (lastSavedKeyRef.current === saveKey) return;
    lastSavedKeyRef.current = saveKey;

    async function persistToServer() {
      try {
        const token = await getAccessToken();
        if (!token) return;
        await saveBibleProgress(token, progress);
      } catch {
        lastSavedKeyRef.current = null;
      }
    }

    persistToServer();
  }, [
    nav.isBootstrapped,
    nav.translation,
    nav.bookId,
    nav.chapterId,
    nav.verses,
    nav.selectedVerseIds,
    prefs.fontSize,
    prefs.fontFamily,
    prefs.lineSpacing,
  ]);

  return {
    // Navigation
    translation: nav.translation,
    books: nav.books,
    bookId: nav.bookId,
    chapters: nav.chapters,
    chapterId: nav.chapterId,
    verses: nav.verses,
    isLoading: nav.isLoading,
    error: nav.error,
    selectedBook: nav.selectedBook,
    selectedChapter: nav.selectedChapter,
    chapterIndex: nav.chapterIndex,
    isBootstrapped: nav.isBootstrapped,
    isNavSheetOpen: nav.isNavSheetOpen,
    setIsNavSheetOpen: nav.setIsNavSheetOpen,
    selectedVerseIds: nav.selectedVerseIds,
    setSelectedVerseIds: nav.setSelectedVerseIds,
    handlePrev: nav.handlePrev,
    handleNext: nav.handleNext,
    handleTranslationChange: nav.handleTranslationChange,
    handleBookChange: nav.handleBookChange,
    handleChapterChange: nav.handleChapterChange,

    // Preferences
    fontSize: prefs.fontSize,
    setFontSize: prefs.setFontSize,
    fontFamily: prefs.fontFamily,
    setFontFamily: prefs.setFontFamily,
    lineSpacing: prefs.lineSpacing,
    setLineSpacing: prefs.setLineSpacing,
    verseTextClasses: prefs.verseTextClasses,

    // Annotations
    notes: annotations.notes,
    highlights: annotations.highlights,
    favorites: annotations.favorites,
    activeHighlightColor: annotations.activeHighlightColor,
    selectedCitation: annotations.selectedCitation,
    isSelectionFavorited: annotations.isSelectionFavorited,
    isNotesOpen: annotations.isNotesOpen,
    setIsNotesOpen: annotations.setIsNotesOpen,
    activeVerseForNote: annotations.activeVerseForNote,
    setActiveVerseForNote: annotations.setActiveVerseForNote,
    activeVerseNumForNote: annotations.activeVerseNumForNote,
    setActiveVerseNumForNote: annotations.setActiveVerseNumForNote,
    activeVerseNumEndForNote: annotations.activeVerseNumEndForNote,
    setActiveVerseNumEndForNote: annotations.setActiveVerseNumEndForNote,
    noteDraft: annotations.noteDraft,
    setNoteDraft: annotations.setNoteDraft,
    editingNoteId: annotations.editingNoteId,
    setEditingNoteId: annotations.setEditingNoteId,
    handleCopy: annotations.handleCopy,
    handleOpenNote: annotations.handleOpenNote,
    handleNoteAction: annotations.handleNoteAction,
    handleEditNote: annotations.handleEditNote,
    handleSaveNote: annotations.handleSaveNote,
    handleDeleteNote: annotations.handleDeleteNote,
    handleBulkHighlight: annotations.handleBulkHighlight,
    handleBulkFavorite: annotations.handleBulkFavorite,
    handleBulkCopy: annotations.handleBulkCopy,
  };
}

export type BibleState = ReturnType<typeof useBibleState>;
