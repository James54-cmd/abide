"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAccessToken } from "@/lib/supabase";
import { fetchBibleBootstrap } from "@/lib/graphql/bible/hooks";
import type {
  Translation,
  BibleBook,
  BibleChapter,
  BibleVerse,
  BibleProgress,
} from "@/features/bible/types";

const PROGRESS_KEY = "abide_bible_progress";

export function useBibleNavigation() {
  const [translation, setTranslation] = useState<Translation>("NIV");
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [bookId, setBookId] = useState("");
  const [chapters, setChapters] = useState<BibleChapter[]>([]);
  const [chapterId, setChapterId] = useState("");
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [isNavSheetOpen, setIsNavSheetOpen] = useState(false);
  const [selectedVerseIds, setSelectedVerseIds] = useState<string[]>([]);
  const [serverProgress, setServerProgress] = useState<BibleProgress | null>(null);

  const selectedBook = useMemo(() => books.find((b) => b.id === bookId) ?? null, [books, bookId]);
  const selectedChapter = useMemo(() => chapters.find((c) => c.id === chapterId) ?? null, [chapters, chapterId]);
  const chapterIndex = useMemo(() => chapters.findIndex((c) => c.id === chapterId), [chapters, chapterId]);
  const bookIndex = useMemo(() => books.findIndex((b) => b.id === bookId), [books, bookId]);
  const atLastChapter = useMemo(
    () => chapters.length > 0 && chapterIndex === chapters.length - 1,
    [chapters.length, chapterIndex]
  );
  const hasNextBook = useMemo(
    () => bookIndex >= 0 && bookIndex < books.length - 1,
    [bookIndex, books.length]
  );
  const chapterLabel = `${selectedBook?.name ?? "Bible"} ${selectedChapter?.number ?? ""}`;

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
            setSelectedVerseIds(matched ? [matched.reference] : []);
          } else {
            setSelectedVerseIds([]);
          }
        } else {
          setSelectedVerseIds([]);
        }

        if (payload.progress) {
          setServerProgress(payload.progress as BibleProgress);
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
    []
  );

  useEffect(() => {
    const abortController = new AbortController();

    let localProgress: BibleProgress | null = null;
    try {
      const raw = window.localStorage.getItem(PROGRESS_KEY);
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
    if (chapterIndex < 0 || chapters.length === 0) return;

    if (chapterIndex < chapters.length - 1) {
      const nextId = chapters[chapterIndex + 1].id;
      void loadBibleBootstrap({
        translation,
        preferredBookId: bookId,
        preferredChapterId: nextId,
      });
      return;
    }

    if (atLastChapter && hasNextBook) {
      const nextBookId = books[bookIndex + 1]?.id;
      if (!nextBookId) return;
      void loadBibleBootstrap({
        translation,
        preferredBookId: nextBookId,
        preferredChapterId: null,
      });
    }
  }, [atLastChapter, bookIndex, books, chapterIndex, chapters, hasNextBook, translation, bookId, loadBibleBootstrap]);

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
          canNext:
            (chapterIndex >= 0 && chapterIndex < chapters.length - 1) ||
            (atLastChapter && hasNextBook),
        },
      })
    );
  }, [chapterLabel, chapterIndex, chapters.length, atLastChapter, hasNextBook]);

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

  return {
    translation,
    books,
    bookId,
    chapters,
    chapterId,
    verses,
    isLoading,
    error,
    isBootstrapped,
    isNavSheetOpen,
    setIsNavSheetOpen,
    selectedVerseIds,
    setSelectedVerseIds,
    selectedBook,
    selectedChapter,
    chapterIndex,
    bookIndex,
    atLastChapter,
    hasNextBook,
    chapterLabel,
    serverProgress,
    handlePrev,
    handleNext,
    handleTranslationChange,
    handleBookChange,
    handleChapterChange,
  };
}
