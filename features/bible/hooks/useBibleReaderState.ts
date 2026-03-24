import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useBibleAnnotations } from "@/lib/graphql/hooks/useBibleAnnotations";
import { useBibleBootstrap } from "@/lib/graphql/hooks/useBibleBootstrap";
import { useBibleHighlights } from "@/lib/graphql/hooks/useBibleHighlights";
import { useBibleNotes } from "@/lib/graphql/hooks/useBibleNotes";
import { useBibleProgress } from "@/lib/graphql/hooks/useBibleProgress";
import {
  buildSelectedCopyText,
  buildVerseTextClasses,
  getSelectedRange,
  type BibleHighlight,
  type BibleVerse,
  type FontFamily,
  type FontSize,
  type HighlightColor,
  type LineSpacing,
} from "@/features/bible/helpers";
import type { BibleBook, BibleChapter, BibleNote, BibleProgress, Translation } from "@/features/bible/types";

export function useBibleReaderState() {
  const [translation, setTranslation] = useState<Translation>("NIV");
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [bookId, setBookId] = useState("");
  const [chapters, setChapters] = useState<BibleChapter[]>([]);
  const [chapterId, setChapterId] = useState("");
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [fontFamily, setFontFamily] = useState<FontFamily>("serif");
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>("normal");
  const [isNavSheetOpen, setIsNavSheetOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [highlights, setHighlights] = useState<BibleHighlight[]>([]);
  const [notes, setNotes] = useState<BibleNote[]>([]);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [selectionAnchor, setSelectionAnchor] = useState<number | null>(null);
  const [selectedHighlightColor, setSelectedHighlightColor] = useState<HighlightColor>("gold");
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  const selectedBook = useMemo(() => books.find((b) => b.id === bookId) ?? null, [books, bookId]);
  const selectedChapter = useMemo(() => chapters.find((c) => c.id === chapterId) ?? null, [chapters, chapterId]);
  const chapterIndex = useMemo(() => chapters.findIndex((c) => c.id === chapterId), [chapters, chapterId]);

  const getAccessToken = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session?.access_token) return null;
    return data.session.access_token;
  }, []);

  const { fetchBootstrap } = useBibleBootstrap(getAccessToken);
  const { fetchAnnotations } = useBibleAnnotations(getAccessToken);
  const { saveProgress } = useBibleProgress(getAccessToken);
  const { saveNote, deleteNote } = useBibleNotes(getAccessToken);
  const { saveHighlight, deleteHighlight } = useBibleHighlights(getAccessToken);

  const loadBibleBootstrap = useCallback(
    async (args: {
      translation: Translation;
      preferredBookId: string | null;
      preferredChapterId: string | null;
      signal?: AbortSignal;
      restoreVerse?: boolean;
      localVerseHint?: number | null;
    }) => {
      setError(null);
      setIsLoading(true);
      try {
        if (args.signal?.aborted) return;
        const { data: payload, error } = await fetchBootstrap({
          translation: args.translation,
          preferredBookId: args.preferredBookId,
          preferredChapterId: args.preferredChapterId,
          signal: args.signal,
        });
        if (args.signal?.aborted) return;
        if (error) {
          setError(error.message);
          return;
        }
        if (!payload) return;

        setTranslation(payload.translation);
        setBooks(payload.books);
        setBookId(payload.selectedBookId);
        setChapters(payload.chapters);
        setChapterId(payload.selectedChapterId);
        setVerses(payload.verses);
        setSelectedVerses([]);
        setSelectionAnchor(null);

        if (args.restoreVerse) {
          const verseNum =
            typeof args.localVerseHint === "number" && Number.isFinite(args.localVerseHint)
              ? args.localVerseHint
              : payload.progress?.verse ?? null;
          if (typeof verseNum === "number" && Number.isFinite(verseNum)) {
            const matched = payload.verses.find((v) => v.verse === verseNum)?.verse ?? null;
            if (matched) {
              setSelectedVerses([matched]);
              setSelectionAnchor(matched);
            }
          }
        }
      } finally {
        if (!args.signal?.aborted) {
          setIsLoading(false);
          setIsBootstrapped(true);
        }
      }
    },
    [fetchBootstrap]
  );

  useEffect(() => {
    const abortController = new AbortController();

    let localProgress: BibleProgress | null = null;
    try {
      const raw = window.localStorage.getItem("abide_bible_progress");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<BibleProgress>;
        if (
          (parsed.translation === "NIV" || parsed.translation === "NLT") &&
          typeof parsed.bookId === "string" &&
          typeof parsed.chapterId === "string"
        ) {
          localProgress = {
            translation: parsed.translation,
            bookId: parsed.bookId,
            chapterId: parsed.chapterId,
            verse:
              typeof parsed.verse === "number" && Number.isFinite(parsed.verse) && parsed.verse > 0
                ? Math.floor(parsed.verse)
                : 1,
          };
        }
      }
    } catch {}

    void loadBibleBootstrap({
      translation: localProgress?.translation ?? "NIV",
      preferredBookId: localProgress?.bookId ?? null,
      preferredChapterId: localProgress?.chapterId ?? null,
      signal: abortController.signal,
      restoreVerse: true,
      localVerseHint: localProgress?.verse ?? null,
    });

    return () => abortController.abort();
  }, [loadBibleBootstrap]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("abide_bible_prefs");
      if (!raw) return;
      const prefs = JSON.parse(raw) as Record<string, string>;
      if (prefs.fontSize && ["small", "medium", "large", "xlarge"].includes(prefs.fontSize))
        setFontSize(prefs.fontSize as FontSize);
      if (prefs.fontFamily && ["serif", "sans"].includes(prefs.fontFamily)) setFontFamily(prefs.fontFamily as FontFamily);
      if (prefs.lineSpacing && ["tight", "normal", "relaxed", "loose"].includes(prefs.lineSpacing))
        setLineSpacing(prefs.lineSpacing as LineSpacing);
    } catch {}
  }, []);

  useEffect(() => {
    window.localStorage.setItem("abide_bible_prefs", JSON.stringify({ fontSize, fontFamily, lineSpacing }));
  }, [fontSize, fontFamily, lineSpacing]);

  useEffect(() => {
    const abortController = new AbortController();
    const run = async () => {
      if (!translation || !bookId || !chapterId) return;
      const token = await getAccessToken();
      if (!token || abortController.signal.aborted) {
        setHighlights([]);
        setNotes([]);
        return;
      }
      const { data, error } = await fetchAnnotations(
        { translation, bookId, chapterId },
        abortController.signal
      );
      if (abortController.signal.aborted) return;
      if (error) {
        setHighlights([]);
        setNotes([]);
        return;
      }
      setHighlights(data?.highlights ?? []);
      setNotes(data?.notes ?? []);
    };
    void run();
    return () => abortController.abort();
  }, [translation, bookId, chapterId, getAccessToken, fetchAnnotations]);

  useEffect(() => {
    if (!isBootstrapped || !bookId || !chapterId) return;
    const activeVerseNumber = selectedVerses[0] ?? 1;
    const progress: BibleProgress = {
      translation,
      bookId,
      chapterId,
      verse: activeVerseNumber,
    };

    window.localStorage.setItem("abide_bible_progress", JSON.stringify(progress));

    void (async () => {
      await saveProgress(progress);
    })();
  }, [isBootstrapped, translation, bookId, chapterId, selectedVerses, saveProgress]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const handlePrev = useCallback(() => {
    if (chapterIndex <= 0) return;
    const prevId = chapters[chapterIndex - 1].id;
    void loadBibleBootstrap({
      translation,
      preferredBookId: bookId,
      preferredChapterId: prevId,
    });
  }, [chapterIndex, chapters, translation, bookId, loadBibleBootstrap]);

  const handleNext = useCallback(() => {
    if (chapterIndex < 0 || chapterIndex >= chapters.length - 1) return;
    const nextId = chapters[chapterIndex + 1].id;
    void loadBibleBootstrap({
      translation,
      preferredBookId: bookId,
      preferredChapterId: nextId,
    });
  }, [chapterIndex, chapters, translation, bookId, loadBibleBootstrap]);

  const selectedRange = useMemo(() => getSelectedRange(selectedVerses), [selectedVerses]);

  const handleSelectVerse = (verseNumber: number, shiftKey: boolean) => {
    setSelectedVerses((prev) => {
      if (shiftKey && selectionAnchor !== null) {
        const start = Math.min(selectionAnchor, verseNumber);
        const end = Math.max(selectionAnchor, verseNumber);
        const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
        return range;
      }
      if (prev.includes(verseNumber)) {
        return prev.filter((v) => v !== verseNumber);
      }
      return [...prev, verseNumber].sort((a, b) => a - b);
    });
    if (!shiftKey) {
      setSelectionAnchor(verseNumber);
    }
  };

  const handleCopySelected = async () => {
    if (!selectedRange || selectedVerses.length === 0) return;
    const selectedTexts = buildSelectedCopyText(verses, selectedVerses);
    try {
      await navigator.clipboard.writeText(selectedTexts);
      if (selectedVerses.length === 1) {
        setToast(`Copied verse ${selectedRange.start}`);
      } else if (selectedRange.contiguous) {
        setToast(`Copied verses ${selectedRange.start}–${selectedRange.end}`);
      } else {
        setToast(`Copied ${selectedVerses.length} verses`);
      }
    } catch {
      setToast("Copy failed");
    }
  };

  const getOverlappingHighlights = useCallback(
    (start: number, end: number) =>
      highlights.filter((h) => !(h.verseEnd < start || h.verseStart > end)),
    [highlights]
  );

  const handleSaveHighlight = async (colorOverride?: HighlightColor) => {
    if (!selectedRange) return;
    if (!selectedRange.contiguous) {
      setToast("Choose a continuous range to highlight");
      return;
    }
    const token = await getAccessToken();
    if (!token) {
      setToast("Please log in to save highlights");
      return;
    }
    const targetColor = colorOverride ?? selectedHighlightColor;
    const overlapping = getOverlappingHighlights(selectedRange.start, selectedRange.end);
    const exactMatch = overlapping.find(
      (h) =>
        h.verseStart === selectedRange.start &&
        h.verseEnd === selectedRange.end &&
        h.color.toLowerCase() === targetColor
    );

    if (overlapping.length > 0) {
      for (const h of overlapping) {
        const { error } = await deleteHighlight(h.id);
        if (error) {
          setToast("Unable to save highlight");
          return;
        }
      }
      setHighlights((prev) => prev.filter((h) => !overlapping.some((x) => x.id === h.id)));
    }

    if (exactMatch) {
      setToast("Highlight removed");
      setSelectedVerses([]);
      setSelectionAnchor(null);
      return;
    }

    const { data: saved, error } = await saveHighlight({
      translation,
      bookId,
      chapterId,
      verseStart: selectedRange.start,
      verseEnd: selectedRange.end,
      color: targetColor,
    });
    if (error) {
      setToast("Unable to save highlight");
      return;
    }
    if (saved) {
      setHighlights((prev) => [...prev.filter((h) => h.id !== saved.id), saved]);
      setToast("Highlight saved");
      setSelectedVerses([]);
      setSelectionAnchor(null);
    }
  };

  const handleSaveNote = () => {
    void (async () => {
      if (!selectedRange || !noteDraft.trim()) return;
      if (!selectedRange.contiguous) {
        setToast("Choose a continuous range for notes");
        return;
      }
      const token = await getAccessToken();
      if (!token) {
        setToast("Please log in to save notes");
        return;
      }
      const { data: saved, error } = await saveNote({
        translation,
        bookId,
        chapterId,
        verseStart: selectedRange.start,
        verseEnd: selectedRange.end,
        content: noteDraft.trim(),
      });
      if (error) {
        setToast("Unable to save note");
        return;
      }
      if (saved) {
        setNotes((prev) => [saved, ...prev.filter((n) => n.id !== saved.id)]);
        setNoteDraft("");
        setIsCreatingNote(false);
        setToast("Note saved");
      }
    })();
  };

  const handleDeleteNote = (id: string) => {
    void (async () => {
      const token = await getAccessToken();
      if (!token) return;
      const { error } = await deleteNote(id);
      if (error) {
        setToast("Unable to delete note");
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
    })();
  };

  const verseTextClasses = buildVerseTextClasses({ fontSize, fontFamily, lineSpacing });

  const chapterLabel = `${selectedBook?.name ?? "Bible"} ${selectedChapter?.number ?? ""}`;

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("abide:bible-header", {
        detail: { chapterLabel, translation },
      })
    );
  }, [chapterLabel, translation]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("abide:bible-bottom-nav", {
        detail: {
          chapterLabel,
          canPrev: chapterIndex > 0,
          canNext: chapterIndex >= 0 && chapterIndex < chapters.length - 1,
        },
      })
    );
  }, [chapterLabel, chapterIndex, chapters.length]);

  useEffect(() => {
    const handleOpenNav = () => setIsNavSheetOpen(true);
    window.addEventListener("abide:bible-open-nav-sheet", handleOpenNav);
    return () => window.removeEventListener("abide:bible-open-nav-sheet", handleOpenNav);
  }, []);

  useEffect(() => {
    const onPrevChapter = () => handlePrev();
    const onNextChapter = () => handleNext();
    window.addEventListener("abide:bible-prev-chapter", onPrevChapter);
    window.addEventListener("abide:bible-next-chapter", onNextChapter);
    return () => {
      window.removeEventListener("abide:bible-prev-chapter", onPrevChapter);
      window.removeEventListener("abide:bible-next-chapter", onNextChapter);
    };
  }, [handleNext, handlePrev]);

  return {
    translation,
    books,
    bookId,
    chapters,
    chapterId,
    verses,
    isLoading,
    error,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    lineSpacing,
    setLineSpacing,
    isNavSheetOpen,
    setIsNavSheetOpen,
    isNotesOpen,
    setIsNotesOpen,
    highlights,
    notes,
    selectedVerses,
    setSelectedVerses,
    selectionAnchor,
    setSelectionAnchor,
    selectedHighlightColor,
    setSelectedHighlightColor,
    isCreatingNote,
    setIsCreatingNote,
    noteDraft,
    setNoteDraft,
    toast,
    selectedBook,
    selectedChapter,
    chapterIndex,
    loadBibleBootstrap,
    handlePrev,
    handleNext,
    selectedRange,
    handleSelectVerse,
    handleCopySelected,
    handleSaveHighlight,
    handleSaveNote,
    handleDeleteNote,
    verseTextClasses,
    chapterLabel,
  };
}
