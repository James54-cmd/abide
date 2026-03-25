"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAccessToken } from "@/lib/supabase";
import {
  saveBibleNote,
  deleteBibleNote,
  bulkSaveBibleHighlights,
  bulkDeleteBibleHighlights,
  bulkSaveBibleFavorites,
  bulkDeleteBibleFavorites,
} from "@/lib/graphql/bible/hooks";
import { useChapterAnnotations } from "@/lib/supabase/bible/hooks";
import { toast } from "sonner";
import type {
  Translation,
  BibleBook,
  BibleChapter,
  BibleVerse,
  BibleNote,
} from "@/features/bible/types";
import { getActiveHighlightColor, getFormattedSelectionCitation } from "@/features/bible/utils";

type AnnotationDeps = {
  translation: Translation;
  bookId: string;
  chapterId: string;
  verses: BibleVerse[];
  selectedVerseIds: string[];
  setSelectedVerseIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedBook: BibleBook | null;
  selectedChapter: BibleChapter | null;
  chapterLabel: string;
  isBootstrapped: boolean;
  isLoading: boolean;
};

export function useBibleAnnotations({
  translation,
  bookId,
  chapterId,
  verses,
  selectedVerseIds,
  setSelectedVerseIds,
  selectedBook,
  selectedChapter,
  chapterLabel,
  isBootstrapped,
  isLoading,
}: AnnotationDeps) {
  const { notes, setNotes, highlights, setHighlights, favorites, setFavorites } =
    useChapterAnnotations({ translation, bookId, chapterId, isBootstrapped });

  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [activeVerseForNote, setActiveVerseForNote] = useState<string | null>(null);
  const [activeVerseNumForNote, setActiveVerseNumForNote] = useState<number | null>(null);
  const [activeVerseNumEndForNote, setActiveVerseNumEndForNote] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const activeHighlightColor = useMemo(
    () => getActiveHighlightColor(selectedVerseIds, verses, highlights),
    [selectedVerseIds, verses, highlights]
  );
  const selectedCitation = useMemo(
    () =>
      getFormattedSelectionCitation(
        selectedVerseIds,
        verses,
        selectedBook?.name ?? "Bible",
        selectedChapter?.number ?? "",
        translation
      ),
    [selectedVerseIds, verses, selectedBook?.name, selectedChapter?.number, translation]
  );
  const isSelectionFavorited = useMemo(
    () =>
      selectedVerseIds.length > 0 &&
      selectedVerseIds.every((id) => {
        const vNum = verses.find((v) => v.reference === id)?.verse;
        return favorites.some((f) => f.verse_start === vNum);
      }),
    [selectedVerseIds, verses, favorites]
  );

  useEffect(() => {
    if (selectedVerseIds.length !== 1 || isLoading) return;
    const ref = selectedVerseIds[0];
    const sanitized = ref.replace(/[:\s]/g, "-");
    const timer = setTimeout(() => {
      const el = document.getElementById(`verse-${sanitized}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedVerseIds, isLoading]);

  const handleCopy = async (verse: BibleVerse) => {
    try {
      await navigator.clipboard.writeText(`${verse.reference} — ${verse.text}`);
      toast.success(`Copied ${verse.reference}`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleOpenNote = (ref: string, verseNum: number) => {
    if (selectedVerseIds.length > 1) {
      const selectedVersesData = verses.filter((v) => selectedVerseIds.includes(v.reference));
      const nums = selectedVersesData.map((v) => v.verse);
      const min = Math.min(...nums);
      const max = Math.max(...nums);

      const rangeRef = `${bookId.toUpperCase()} ${selectedChapter?.number}:${min}${min !== max ? `-${max}` : ""}`;
      setActiveVerseForNote(rangeRef);
      setActiveVerseNumForNote(min);
      setActiveVerseNumEndForNote(max);
    } else {
      setActiveVerseForNote(ref);
      setActiveVerseNumForNote(verseNum);
      setActiveVerseNumEndForNote(verseNum);
    }
    setNoteDraft("");
    setEditingNoteId(null);
    setIsNotesOpen(true);
  };

  const handleNoteAction = useCallback(() => {
    if (selectedVerseIds.length === 0) return;
    const firstRef = selectedVerseIds[0];
    const verseNum = verses.find((v) => v.reference === firstRef)?.verse ?? 1;
    handleOpenNote(firstRef, verseNum);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVerseIds, verses]);

  const handleEditNote = (note: BibleNote) => {
    setActiveVerseForNote(
      `${bookId.toUpperCase()} ${selectedChapter?.number}:${note.verse_start}${
        note.verse_end && note.verse_end !== note.verse_start ? `-${note.verse_end}` : ""
      }`
    );
    setActiveVerseNumForNote(note.verse_start);
    setActiveVerseNumEndForNote(note.verse_end || note.verse_start);
    setNoteDraft(note.content);
    setEditingNoteId(note.id);
    setIsNotesOpen(true);
  };

  const handleSaveNote = async () => {
    if (!activeVerseForNote || activeVerseNumForNote === null || !noteDraft.trim()) return;

    const token = await getAccessToken();
    if (!token) return;

    const input = {
      id: editingNoteId,
      translation,
      bookId,
      chapterId,
      verseStart: activeVerseNumForNote,
      verseEnd: activeVerseNumEndForNote || activeVerseNumForNote,
      content: noteDraft.trim(),
    };

    const saved = await saveBibleNote(token, input);

    if (saved) {
      if (!editingNoteId) {
        setNotes((prev) => [saved, ...prev]);
        toast.success("Note saved");
      } else {
        setNotes((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
        toast.success("Note updated");
      }
    }

    setNoteDraft("");
    setEditingNoteId(null);
    setActiveVerseForNote(null);
    setActiveVerseNumForNote(null);
    setActiveVerseNumEndForNote(null);
    setIsNotesOpen(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    const token = await getAccessToken();
    if (!token) return;

    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      await deleteBibleNote(token, noteId);
      toast.success("Note deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleBulkHighlight = async (color: string) => {
    if (selectedVerseIds.length === 0) return;

    const token = await getAccessToken();
    if (!token) return;

    const selectedVersesData = verses.filter((v) => selectedVerseIds.includes(v.reference));
    const selectedNums = selectedVersesData.map((v) => v.verse);

    const allMatching = selectedNums.every((num) => {
      const h = highlights.find((hl) => hl.verse_start === num);
      return h && h.color === color;
    });

    if (allMatching) {
      const highlightsToRemove = highlights.filter((h) => selectedNums.includes(h.verse_start));
      const idsToRemove = highlightsToRemove.map((h) => h.id);

      setHighlights((prev) => prev.filter((h) => !idsToRemove.includes(h.id)));
      await bulkDeleteBibleHighlights(token, idsToRemove);
      toast.success("Highlights removed");
    } else {
      const itemsToClear = highlights.filter((h) => selectedNums.includes(h.verse_start));
      const idsToClear = itemsToClear.map((h) => h.id);

      if (idsToClear.length > 0) {
        await bulkDeleteBibleHighlights(token, idsToClear);
      }

      const inputs = selectedVersesData.map((v) => ({
        translation,
        bookId,
        chapterId,
        verseStart: v.verse,
        verseEnd: v.verse,
        color,
      }));

      const newHighlights = await bulkSaveBibleHighlights(token, inputs);

      setHighlights((prev) => {
        const others = prev.filter((h) => !selectedNums.includes(h.verse_start));
        return [...others, ...newHighlights];
      });
      toast.success(
        `Highlighted ${selectedVerseIds.length} ${selectedVerseIds.length === 1 ? "verse" : "verses"}`
      );
    }
  };

  const handleBulkFavorite = async () => {
    if (selectedVerseIds.length === 0) return;

    const token = await getAccessToken();
    if (!token) return;

    const selectedVersesData = verses.filter((v) => selectedVerseIds.includes(v.reference));
    const selectedNums = selectedVersesData.map((v) => v.verse);

    const allFavorited = selectedNums.every((num) => favorites.some((f) => f.verse_start === num));

    if (allFavorited) {
      const favoritesToRemove = favorites.filter((f) => selectedNums.includes(f.verse_start));
      const idsToRemove = favoritesToRemove.map((f) => f.id);
      setFavorites((prev) => prev.filter((f) => !idsToRemove.includes(f.id)));
      await bulkDeleteBibleFavorites(token, idsToRemove);
      toast.success("Removed from favorites");
    } else {
      const itemsToClear = favorites.filter((f) => selectedNums.includes(f.verse_start));
      if (itemsToClear.length > 0) {
        await bulkDeleteBibleFavorites(
          token,
          itemsToClear.map((f) => f.id)
        );
      }

      const inputs = selectedVersesData.map((v) => ({
        translation,
        bookId,
        chapterId,
        verseStart: v.verse,
        verseEnd: v.verse,
        verseReference: v.reference,
        verseText: v.text,
      }));

      const newFavorites = await bulkSaveBibleFavorites(token, inputs);
      setFavorites((prev) => {
        const others = prev.filter((f) => !selectedNums.includes(f.verse_start));
        return [...others, ...newFavorites];
      });
      toast.success("Added to favorites");
    }
  };

  const handleBulkCopy = async () => {
    if (selectedVerseIds.length === 0) return;
    const selectedVersesData = verses
      .filter((v) => selectedVerseIds.includes(v.reference))
      .sort((a, b) => a.verse - b.verse);

    const text = selectedVersesData.map((v) => `${v.verse} ${v.text}`).join("\n");
    const label = `${chapterLabel}:${selectedVersesData[0].verse}${
      selectedVersesData.length > 1
        ? `-${selectedVersesData[selectedVersesData.length - 1].verse}`
        : ""
    }`;

    try {
      await navigator.clipboard.writeText(`${label}\n${text}`);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  return {
    notes,
    highlights,
    favorites,
    isNotesOpen,
    setIsNotesOpen,
    activeVerseForNote,
    setActiveVerseForNote,
    activeVerseNumForNote,
    setActiveVerseNumForNote,
    activeVerseNumEndForNote,
    setActiveVerseNumEndForNote,
    noteDraft,
    setNoteDraft,
    editingNoteId,
    setEditingNoteId,
    activeHighlightColor,
    selectedCitation,
    isSelectionFavorited,
    handleCopy,
    handleOpenNote,
    handleNoteAction,
    handleEditNote,
    handleSaveNote,
    handleDeleteNote,
    handleBulkHighlight,
    handleBulkFavorite,
    handleBulkCopy,
  };
}
