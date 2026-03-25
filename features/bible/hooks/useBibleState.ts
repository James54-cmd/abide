"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  fetchBibleBootstrap,
  saveBibleProgress,
} from "@/lib/graphql/bible/hooks";
import type {
  Translation,
  FontSize,
  FontFamily,
  LineSpacing,
  BibleBook,
  BibleChapter,
  BibleVerse,
  Note,
  BibleProgress,
} from "@/features/bible/types";
import {
  FONT_SIZE_CLASSES,
  FONT_FAMILY_CLASSES,
  LINE_SPACING_CLASSES,
} from "@/features/bible/types";
import { cn } from "@/lib/utils";

/** Dedupes save mutation when React Strict Mode double-invokes effects (dev). */
let lastServerSavedProgressKey: string | null = null;

export function useBibleState() {
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
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeVerseForNote, setActiveVerseForNote] = useState<string | null>(null);
  const [activeVerseId, setActiveVerseId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  const selectedBook = useMemo(() => books.find((b) => b.id === bookId) ?? null, [books, bookId]);
  const selectedChapter = useMemo(() => chapters.find((c) => c.id === chapterId) ?? null, [chapters, chapterId]);
  const chapterIndex = useMemo(() => chapters.findIndex((c) => c.id === chapterId), [chapters, chapterId]);

  const getAccessToken = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) return null;
    return data.session.access_token;
  }, []);

  // Core bootstrap loader — single GraphQL call returns books, chapters, verses, progress
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
        const token = await getAccessToken();
        if (args.signal?.aborted) return;

        const payload = await fetchBibleBootstrap({
          translation: args.translation,
          preferredBookId: args.preferredBookId,
          preferredChapterId: args.preferredChapterId,
          token,
          signal: args.signal,
        });
        if (args.signal?.aborted) return;

        setTranslation(payload.translation as Translation);
        setBooks(payload.books);
        setBookId(payload.selectedBookId);
        setChapters(payload.chapters);
        setChapterId(payload.selectedChapterId);
        setVerses(payload.verses);

        if (args.restoreVerse) {
          const verseNum =
            typeof args.localVerseHint === "number" && Number.isFinite(args.localVerseHint)
              ? args.localVerseHint
              : payload.progress?.verse ?? null;
          if (typeof verseNum === "number" && Number.isFinite(verseNum)) {
            const matched = payload.verses.find((v) => v.verse === verseNum);
            setActiveVerseId(matched?.reference ?? null);
          } else {
            setActiveVerseId(null);
          }
        } else {
          setActiveVerseId(null);
        }
      } catch (err) {
        if (args.signal?.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error.");
      } finally {
        if (!args.signal?.aborted) {
          setIsLoading(false);
          setIsBootstrapped(true);
        }
      }
    },
    [getAccessToken]
  );

  // Initial load — read local progress, then bootstrap
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

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("abide_bible_prefs");
      if (!raw) return;
      const prefs = JSON.parse(raw) as Record<string, string>;
      if (prefs.fontSize && ["small", "medium", "large", "xlarge"].includes(prefs.fontSize)) setFontSize(prefs.fontSize as FontSize);
      if (prefs.fontFamily && ["serif", "sans"].includes(prefs.fontFamily)) setFontFamily(prefs.fontFamily as FontFamily);
      if (prefs.lineSpacing && ["tight", "normal", "relaxed", "loose"].includes(prefs.lineSpacing)) setLineSpacing(prefs.lineSpacing as LineSpacing);
    } catch {}
    try {
      const raw = window.localStorage.getItem("abide_bible_notes");
      if (raw) setNotes(JSON.parse(raw) as Note[]);
    } catch {}
  }, []);

  // Persist preferences
  useEffect(() => {
    window.localStorage.setItem("abide_bible_prefs", JSON.stringify({ fontSize, fontFamily, lineSpacing }));
  }, [fontSize, fontFamily, lineSpacing]);

  // Persist notes
  useEffect(() => {
    window.localStorage.setItem("abide_bible_notes", JSON.stringify(notes));
  }, [notes]);

  // Save progress (local + server)
  useEffect(() => {
    if (!isBootstrapped || !bookId || !chapterId) return;
    const activeVerseNumber =
      verses.find((verse) => verse.reference === activeVerseId)?.verse ?? 1;
    const progress: BibleProgress = {
      translation,
      bookId,
      chapterId,
      verse: activeVerseNumber,
    };

    window.localStorage.setItem("abide_bible_progress", JSON.stringify(progress));

    const saveKey = `${progress.translation}|${progress.bookId}|${progress.chapterId}|${progress.verse}`;
    if (lastServerSavedProgressKey === saveKey) return;
    lastServerSavedProgressKey = saveKey;

    void (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        await saveBibleProgress(token, progress);
      } catch {
        lastServerSavedProgressKey = null;
      }
    })();
  }, [isBootstrapped, translation, bookId, chapterId, verses, activeVerseId, getAccessToken]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Chapter navigation — re-bootstrap with the new chapter
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

  // Verse actions
  const handleCopy = async (verse: BibleVerse) => {
    try {
      await navigator.clipboard.writeText(`${verse.reference} — ${verse.text}`);
      setToast(`Copied ${verse.reference}`);
    } catch {
      setToast("Copy failed");
    }
  };

  const handleOpenNote = (ref: string) => {
    setActiveVerseForNote(ref);
    setNoteDraft("");
    setIsNotesOpen(true);
  };

  const handleSaveNote = () => {
    if (!activeVerseForNote || !noteDraft.trim()) return;
    setNotes((prev) => [
      { id: `note-${Date.now()}`, verseReference: activeVerseForNote, content: noteDraft.trim(), timestamp: new Date().toISOString() },
      ...prev,
    ]);
    setNoteDraft("");
    setActiveVerseForNote(null);
    setToast("Note saved");
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const verseTextClasses = cn(
    "text-ink dark:text-parchment",
    FONT_SIZE_CLASSES[fontSize],
    FONT_FAMILY_CLASSES[fontFamily],
    LINE_SPACING_CLASSES[lineSpacing]
  );

  const chapterLabel = `${selectedBook?.name ?? "Bible"} ${selectedChapter?.number ?? ""}`;

  // Event dispatches for TopBar / BottomNav
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

  // Event listeners for TopBar / BottomNav actions
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

  // Settings sheet actions — re-bootstrap when translation, book, or chapter changes
  const handleTranslationChange = useCallback(
    (newTranslation: Translation) => {
      void loadBibleBootstrap({
        translation: newTranslation,
        preferredBookId: null,
        preferredChapterId: null,
      });
    },
    [loadBibleBootstrap]
  );

  const handleBookChange = useCallback(
    (newBookId: string) => {
      void loadBibleBootstrap({
        translation,
        preferredBookId: newBookId,
        preferredChapterId: null,
      });
    },
    [translation, loadBibleBootstrap]
  );

  const handleChapterChange = useCallback(
    (newChapterId: string) => {
      void loadBibleBootstrap({
        translation,
        preferredBookId: bookId,
        preferredChapterId: newChapterId,
      });
    },
    [translation, bookId, loadBibleBootstrap]
  );

  return {
    // Data
    translation,
    books,
    bookId,
    chapters,
    chapterId,
    verses,
    isLoading,
    error,
    selectedBook,
    selectedChapter,
    chapterIndex,

    // Preferences
    fontSize,
    fontFamily,
    lineSpacing,
    verseTextClasses,

    // UI state
    isNavSheetOpen,
    isNotesOpen,
    notes,
    activeVerseForNote,
    activeVerseId,
    noteDraft,
    toast,

    // Setters
    setFontSize,
    setFontFamily,
    setLineSpacing,
    setIsNavSheetOpen,
    setIsNotesOpen,
    setActiveVerseId,
    setNoteDraft,
    setActiveVerseForNote,

    // Handlers
    handlePrev,
    handleNext,
    handleCopy,
    handleOpenNote,
    handleSaveNote,
    handleDeleteNote,
    handleTranslationChange,
    handleBookChange,
    handleChapterChange,
  };
}

export type BibleState = ReturnType<typeof useBibleState>;
