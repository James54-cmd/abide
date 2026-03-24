"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { gql } from "@apollo/client";
import { Copy, Highlighter, MessageSquare, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import EmptyState from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { getApolloClient } from "@/lib/graphql/client";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  DropdownMenuSelect,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  buildSelectedCopyText,
  buildVerseTextClasses,
  FONT_SIZE_LABELS,
  getSelectedRange,
  getVerseHighlightTextClass,
  HIGHLIGHT_COLORS,
  type BibleHighlight,
  type BibleVerse,
  type FontFamily,
  type FontSize,
  type HighlightColor,
  type LineSpacing,
} from "./helpers";

type Translation = "NIV" | "NLT";

type BibleBook = { id: string; name: string };
type BibleChapter = { id: string; number: number };
type BibleProgress = { translation: Translation; bookId: string; chapterId: string; verse: number };
type BibleNote = {
  id: string;
  verseStart: number;
  verseEnd: number;
  content: string;
  createdAt: string;
};
type BibleBootstrap = {
  translation: Translation;
  books: BibleBook[];
  selectedBookId: string;
  chapters: BibleChapter[];
  selectedChapterId: string;
  verses: BibleVerse[];
  progress?: BibleProgress | null;
};

const BIBLE_BOOTSTRAP_QUERY = gql`
  query BibleBootstrap(
    $translation: String
    $preferredBookId: String
    $preferredChapterId: String
  ) {
    bibleBootstrap(
      translation: $translation
      preferredBookId: $preferredBookId
      preferredChapterId: $preferredChapterId
    ) {
      translation
      books {
        id
        name
      }
      selectedBookId
      chapters {
        id
        number
      }
      selectedChapterId
      verses {
        reference
        text
        verse
      }
      progress {
        translation
        bookId
        chapterId
        verse
      }
    }
  }
`;

const SAVE_BIBLE_PROGRESS_MUTATION = gql`
  mutation SaveBibleProgress($input: SaveBibleProgressInput!) {
    saveBibleProgress(input: $input) {
      translation
      bookId
      chapterId
      verse
    }
  }
`;

const BIBLE_ANNOTATIONS_QUERY = gql`
  query BibleAnnotations($translation: String!, $bookId: String!, $chapterId: String!) {
    bibleAnnotations(translation: $translation, bookId: $bookId, chapterId: $chapterId) {
      highlights {
        id
        verseStart
        verseEnd
        color
      }
      notes {
        id
        verseStart
        verseEnd
        content
        createdAt
      }
    }
  }
`;

const SAVE_BIBLE_HIGHLIGHT_MUTATION = gql`
  mutation SaveBibleHighlight($input: SaveBibleHighlightInput!) {
    saveBibleHighlight(input: $input) {
      id
      verseStart
      verseEnd
      color
    }
  }
`;

const DELETE_BIBLE_HIGHLIGHT_MUTATION = gql`
  mutation DeleteBibleHighlight($id: String!) {
    deleteBibleHighlight(id: $id)
  }
`;

const DELETE_BIBLE_NOTE_MUTATION = gql`
  mutation DeleteBibleNote($id: String!) {
    deleteBibleNote(id: $id)
  }
`;

const SAVE_BIBLE_NOTE_MUTATION = gql`
  mutation SaveBibleNote($input: SaveBibleNoteInput!) {
    saveBibleNote(input: $input) {
      id
      verseStart
      verseEnd
      content
      createdAt
    }
  }
`;

/** Dedupes save mutation when React Strict Mode double-invokes effects (dev). */
let lastServerSavedProgressKey: string | null = null;

export default function BiblePage() {
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
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) return null;
    return data.session.access_token;
  }, []);

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
        const client = getApolloClient();
        const { data } = await client.query<{ bibleBootstrap: BibleBootstrap }>({
          query: BIBLE_BOOTSTRAP_QUERY,
          variables: {
            translation: args.translation,
            preferredBookId: args.preferredBookId,
            preferredChapterId: args.preferredChapterId,
          },
          fetchPolicy: "no-cache",
          context: {
            ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
            ...(args.signal ? { fetchOptions: { signal: args.signal } } : {}),
          },
        });
        if (args.signal?.aborted) return;

        const payload = data?.bibleBootstrap;
        if (!payload) {
          throw new Error("Unable to bootstrap Bible data.");
        }

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
      if (prefs.fontSize && ["small", "medium", "large", "xlarge"].includes(prefs.fontSize)) setFontSize(prefs.fontSize as FontSize);
      if (prefs.fontFamily && ["serif", "sans"].includes(prefs.fontFamily)) setFontFamily(prefs.fontFamily as FontFamily);
      if (prefs.lineSpacing && ["tight", "normal", "relaxed", "loose"].includes(prefs.lineSpacing)) setLineSpacing(prefs.lineSpacing as LineSpacing);
    } catch {}
  }, []);

  useEffect(() => {
    window.localStorage.setItem("abide_bible_prefs", JSON.stringify({ fontSize, fontFamily, lineSpacing }));
  }, [fontSize, fontFamily, lineSpacing]);

  useEffect(() => {
    const abortController = new AbortController();
    const run = async () => {
      if (!translation || !bookId || !chapterId) return;
      try {
        const token = await getAccessToken();
        if (!token || abortController.signal.aborted) {
          setHighlights([]);
          setNotes([]);
          return;
        }
        const client = getApolloClient();
        const { data } = await client.query<{
          bibleAnnotations?: { highlights: BibleHighlight[]; notes: BibleNote[] };
        }>({
          query: BIBLE_ANNOTATIONS_QUERY,
          variables: { translation, bookId, chapterId },
          fetchPolicy: "no-cache",
          context: { headers: { Authorization: `Bearer ${token}` } },
        });
        if (abortController.signal.aborted) return;
        setHighlights(data?.bibleAnnotations?.highlights ?? []);
        setNotes(data?.bibleAnnotations?.notes ?? []);
      } catch {
        if (!abortController.signal.aborted) {
          setHighlights([]);
          setNotes([]);
        }
      }
    };
    void run();
    return () => abortController.abort();
  }, [translation, bookId, chapterId, getAccessToken]);

  useEffect(() => {
    if (!isBootstrapped || !bookId || !chapterId) return;
    const activeVerseNumber =
      selectedVerses[0] ?? 1;
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
        const client = getApolloClient();
        await client.mutate({
          mutation: SAVE_BIBLE_PROGRESS_MUTATION,
          variables: {
            input: progress,
          },
          context: { headers: { Authorization: `Bearer ${token}` } },
        });
      } catch {
        lastServerSavedProgressKey = null;
        // Silent fallback to local storage.
      }
    })();
  }, [isBootstrapped, translation, bookId, chapterId, selectedVerses, getAccessToken]);

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
    if (!selectedRange) return;
    const selectedTexts = buildSelectedCopyText(verses, selectedRange);
    try {
      await navigator.clipboard.writeText(selectedTexts);
      setToast(
        selectedRange.start === selectedRange.end
          ? `Copied verse ${selectedRange.start}`
          : `Copied verses ${selectedRange.start}-${selectedRange.end}`
      );
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
    try {
      const token = await getAccessToken();
      if (!token) {
        setToast("Please log in to save highlights");
        return;
      }
      const client = getApolloClient();
      const targetColor = colorOverride ?? selectedHighlightColor;
      const overlapping = getOverlappingHighlights(selectedRange.start, selectedRange.end);
      const exactMatch = overlapping.find(
        (h) =>
          h.verseStart === selectedRange.start &&
          h.verseEnd === selectedRange.end &&
          h.color.toLowerCase() === targetColor
      );

      if (overlapping.length > 0) {
        await Promise.all(
          overlapping.map((h) =>
            client.mutate({
              mutation: DELETE_BIBLE_HIGHLIGHT_MUTATION,
              variables: { id: h.id },
              context: { headers: { Authorization: `Bearer ${token}` } },
            })
          )
        );
        setHighlights((prev) => prev.filter((h) => !overlapping.some((x) => x.id === h.id)));
      }

      if (exactMatch) {
        setToast("Highlight removed");
        setSelectedVerses([]);
        setSelectionAnchor(null);
        return;
      }

      const { data } = await client.mutate<{
        saveBibleHighlight?: BibleHighlight;
      }>({
        mutation: SAVE_BIBLE_HIGHLIGHT_MUTATION,
        variables: {
          input: {
            translation,
            bookId,
            chapterId,
            verseStart: selectedRange.start,
            verseEnd: selectedRange.end,
            color: targetColor,
          },
        },
        context: { headers: { Authorization: `Bearer ${token}` } },
      });
      const saved = data?.saveBibleHighlight;
      if (saved) {
        setHighlights((prev) => [...prev.filter((h) => h.id !== saved.id), saved]);
        setToast("Highlight saved");
        setSelectedVerses([]);
        setSelectionAnchor(null);
      }
    } catch {
      setToast("Unable to save highlight");
    }
  };

  const handleSaveNote = () => {
    void (async () => {
      if (!selectedRange || !noteDraft.trim()) return;
      try {
        const token = await getAccessToken();
        if (!token) {
          setToast("Please log in to save notes");
          return;
        }
        const client = getApolloClient();
        const { data } = await client.mutate<{
          saveBibleNote?: BibleNote;
        }>({
          mutation: SAVE_BIBLE_NOTE_MUTATION,
          variables: {
            input: {
              translation,
              bookId,
              chapterId,
              verseStart: selectedRange.start,
              verseEnd: selectedRange.end,
              content: noteDraft.trim(),
            },
          },
          context: { headers: { Authorization: `Bearer ${token}` } },
        });
        const saved = data?.saveBibleNote;
        if (saved) {
          setNotes((prev) => [saved, ...prev.filter((n) => n.id !== saved.id)]);
          setNoteDraft("");
          setIsCreatingNote(false);
          setToast("Note saved");
        }
      } catch {
        setToast("Unable to save note");
      }
    })();
  };

  const handleRemoveHighlight = () => {
    void (async () => {
      if (!selectedRange) return;
      try {
        const token = await getAccessToken();
        if (!token) return;
        const overlapping = getOverlappingHighlights(selectedRange.start, selectedRange.end);
        if (overlapping.length === 0) {
          setToast("No highlight to remove");
          return;
        }
        const client = getApolloClient();
        await Promise.all(
          overlapping.map((h) =>
            client.mutate({
              mutation: DELETE_BIBLE_HIGHLIGHT_MUTATION,
              variables: { id: h.id },
              context: { headers: { Authorization: `Bearer ${token}` } },
            })
          )
        );
        setHighlights((prev) => prev.filter((h) => !overlapping.some((x) => x.id === h.id)));
        setToast("Highlight removed");
        setSelectedVerses([]);
        setSelectionAnchor(null);
      } catch {
        setToast("Unable to remove highlight");
      }
    })();
  };

  const handleDeleteNote = (id: string) => {
    void (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const client = getApolloClient();
        await client.mutate({
          mutation: DELETE_BIBLE_NOTE_MUTATION,
          variables: { id },
          context: { headers: { Authorization: `Bearer ${token}` } },
        });
        setNotes((prev) => prev.filter((n) => n.id !== id));
      } catch {
        setToast("Unable to delete note");
      }
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

  return (
    <PageTransition>
      <div className="bg-parchment dark:bg-dark-bg">
        <main>
          <AnimatePresence mode="wait">
            {toast ? (
              <motion.div
                key="toast"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="sticky top-0 z-30 flex justify-center py-2"
              >
                <span className="text-xs bg-gold text-white rounded-full px-3 py-1 shadow-sm">{toast}</span>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className={cn("px-5 py-6", selectedRange ? "pb-28" : "")}>
            {error ? (
              <p className="text-xs text-red-600 text-center">{error}</p>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              </div>
            ) : verses.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={chapterId}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {verses.map((verse, idx) => {
                    const isActive = selectedVerses.includes(verse.verse);
                    const highlightTextClass = getVerseHighlightTextClass(verse.verse, highlights);
                    return (
                      <motion.div
                        key={verse.reference}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(idx * 0.01, 0.1), duration: 0.15 }}
                        onClick={(e) => handleSelectVerse(verse.verse, e.shiftKey)}
                        className="group cursor-pointer"
                      >
                        <div
                          className={cn(
                            "relative rounded-xl px-3 pt-2 pb-5 -mx-1 transition-colors",
                            isActive ? "bg-gold/[0.03] dark:bg-gold/[0.07]" : "hover:bg-gold/[0.04]"
                          )}
                        >
                          <p className={verseTextClasses}>
                            <sup className="text-gold font-bold text-[0.65em] mr-1 select-none">{verse.verse}</sup>
                            <span
                              className={cn(
                                "rounded px-0.5 decoration-2 underline-offset-4",
                                highlightTextClass,
                                isActive && "underline decoration-dotted decoration-gold"
                              )}
                            >
                              {verse.text}
                            </span>
                          </p>
                        </div>
                      </motion.div>
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
        {selectedRange ? (
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-4 inset-x-0 z-[60] px-4"
          >
            <div className="mx-auto w-full max-w-[430px] rounded-2xl border border-gold/25 bg-white/95 dark:bg-dark-card/95 backdrop-blur-md shadow-lg px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted">
                  {selectedRange.start === selectedRange.end
                    ? `Verse ${selectedRange.start} selected`
                    : `Verses ${selectedRange.start}-${selectedRange.end} selected`}
                </p>
                <button
                  onClick={() => {
                    setSelectedVerses([]);
                    setSelectionAnchor(null);
                  }}
                  className="text-sm text-muted hover:text-ink dark:hover:text-parchment transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleCopySelected}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink dark:text-parchment bg-white dark:bg-dark-card border border-gold/15 rounded-xl px-3 py-2 transition-colors hover:bg-gold/[0.06]"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={() => void handleSaveHighlight()}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink dark:text-parchment bg-white dark:bg-dark-card border border-gold/15 rounded-xl px-3 py-2 transition-colors hover:bg-gold/[0.06]"
                >
                  <Highlighter className="w-4 h-4" />
                  Highlight
                </button>
                <button
                  onClick={handleRemoveHighlight}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink dark:text-parchment bg-white dark:bg-dark-card border border-gold/15 rounded-xl px-3 py-2 transition-colors hover:bg-gold/[0.06]"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
                <button
                  onClick={() => {
                    setIsNotesOpen(true);
                    setIsCreatingNote(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink dark:text-parchment bg-white dark:bg-dark-card border border-gold/15 rounded-xl px-3 py-2 transition-colors hover:bg-gold/[0.06]"
                >
                  <MessageSquare className="w-4 h-4" />
                  Note
                </button>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <p className="text-[11px] text-muted">Color</p>
                <div className="flex items-center gap-1.5">
                  {HIGHLIGHT_COLORS.map((color) => (
                    <button
                      key={color.key}
                      onClick={() => {
                        setSelectedHighlightColor(color.key);
                        if (selectedRange) {
                          void handleSaveHighlight(color.key);
                        }
                      }}
                      aria-label={`Highlight color ${color.key}`}
                      className={cn(
                        "w-5 h-5 rounded-full border transition-all",
                        color.chipClass,
                        selectedHighlightColor === color.key
                          ? "border-ink dark:border-parchment ring-2 ring-gold/35"
                          : "border-white/80 dark:border-dark-bg"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {isNavSheetOpen ? (
        <div className="fixed inset-0 z-[70]" onClick={() => setIsNavSheetOpen(false)}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/30" />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 inset-x-0 w-full max-w-[430px] mx-auto rounded-t-3xl bg-white dark:bg-dark-card border-t border-gold/10 max-h-[85dvh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-dark-card pt-3 pb-2 px-5">
              <div className="w-10 h-1 bg-gold/20 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-ink dark:text-parchment">Settings</h3>
                <button onClick={() => setIsNavSheetOpen(false)} className="p-1.5 rounded-lg hover:bg-gold/10">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-5 pb-8 space-y-6">
              <section className="space-y-3">
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Bible</h4>
                <div className="space-y-2">
                  <DropdownMenuSelect
                    value={translation}
                    onValueChange={(v) =>
                      void loadBibleBootstrap({
                        translation: v as Translation,
                        preferredBookId: null,
                        preferredChapterId: null,
                      })
                    }
                    label={translation}
                  >
                    <DropdownMenuRadioItem value="NIV">NIV</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="NLT">NLT</DropdownMenuRadioItem>
                  </DropdownMenuSelect>

                  <DropdownMenuSelect
                    value={bookId}
                    onValueChange={(id) =>
                      void loadBibleBootstrap({
                        translation,
                        preferredBookId: id,
                        preferredChapterId: null,
                      })
                    }
                    label={selectedBook?.name ?? "Book"}
                    disabled={books.length === 0}
                  >
                    {books.map((b) => (
                      <DropdownMenuRadioItem key={b.id} value={b.id}>{b.name}</DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuSelect>

                  <DropdownMenuSelect
                    value={chapterId}
                    onValueChange={(id) =>
                      void loadBibleBootstrap({
                        translation,
                        preferredBookId: bookId,
                        preferredChapterId: id,
                      })
                    }
                    label={selectedChapter ? `Chapter ${selectedChapter.number}` : "Chapter"}
                    disabled={chapters.length === 0}
                  >
                    {chapters.map((c) => (
                      <DropdownMenuRadioItem key={c.id} value={c.id}>Chapter {c.number}</DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuSelect>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Reading</h4>

                <div>
                  <p className="text-xs text-muted mb-2">Text Size</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["small", "medium", "large", "xlarge"] as FontSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => setFontSize(size)}
                        className={cn(
                          "rounded-lg h-10 text-xs font-semibold transition-all",
                          fontSize === size ? "bg-gold text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-muted"
                        )}
                      >
                        {FONT_SIZE_LABELS[size]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted mb-2">Font</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["serif", "sans"] as FontFamily[]).map((family) => (
                      <button
                        key={family}
                        onClick={() => setFontFamily(family)}
                        className={cn(
                          "rounded-lg h-10 text-sm transition-all capitalize",
                          family === "serif" ? "font-serif" : "font-sans",
                          fontFamily === family ? "bg-gold text-white shadow-sm font-semibold" : "bg-slate-100 dark:bg-slate-800 text-muted"
                        )}
                      >
                        {family}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted mb-2">Line Spacing</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["tight", "normal", "relaxed", "loose"] as LineSpacing[]).map((sp) => (
                      <button
                        key={sp}
                        onClick={() => setLineSpacing(sp)}
                        className={cn(
                          "rounded-lg h-10 text-[11px] font-medium capitalize transition-all",
                          lineSpacing === sp ? "bg-gold text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-muted"
                        )}
                      >
                        {sp}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Preview</h4>
                <div className="rounded-xl border border-gold/10 bg-parchment/50 dark:bg-dark-bg/50 p-3">
                  <p className={verseTextClasses}>
                    <sup className="text-gold font-bold text-[0.65em] mr-1">1</sup>
                    In the beginning God created the heavens and the earth.
                  </p>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      ) : null}

      {isNotesOpen ? (
        <div className="fixed inset-0 z-[80]" onClick={() => setIsNotesOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-[400px] rounded-2xl bg-white dark:bg-dark-card border border-gold/10 shadow-lg max-h-[80dvh] flex flex-col"
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h3 className="font-serif text-lg font-semibold text-ink dark:text-parchment">
                  {isCreatingNote ? "Add Note" : `Notes (${notes.length})`}
                </h3>
                <button onClick={() => setIsNotesOpen(false)} className="p-1.5 rounded-lg hover:bg-gold/10">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {isCreatingNote ? (
                  <div className="space-y-3">
                    <p className="text-xs text-gold font-medium">
                      {selectedRange
                        ? selectedRange.start === selectedRange.end
                          ? `Verse ${selectedRange.start}`
                          : `Verses ${selectedRange.start}-${selectedRange.end}`
                        : "No verses selected"}
                    </p>
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      autoFocus
                      placeholder="Write your reflection..."
                      className="w-full min-h-28 rounded-xl border border-gold/10 bg-parchment/30 dark:bg-dark-bg/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveNote} disabled={!noteDraft.trim()} className="flex-1">Save</Button>
                      <Button size="sm" variant="outline" onClick={() => { setIsCreatingNote(false); setNoteDraft(""); }} className="flex-1">Cancel</Button>
                    </div>
                  </div>
                ) : notes.length === 0 ? (
                  <p className="text-sm text-muted text-center py-10">
                    Select verse(s), then tap &quot;Note&quot; to start.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div key={note.id} className="rounded-xl bg-parchment/40 dark:bg-dark-bg/40 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gold">
                              {note.verseStart === note.verseEnd
                                ? `Verse ${note.verseStart}`
                                : `Verses ${note.verseStart}-${note.verseEnd}`}
                            </p>
                            <p className="text-sm mt-1 whitespace-pre-wrap text-ink dark:text-parchment">{note.content}</p>
                            <p className="text-[10px] text-muted mt-1.5">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-muted hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </PageTransition>
  );
}
