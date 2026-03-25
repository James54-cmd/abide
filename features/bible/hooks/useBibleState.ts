"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  fetchBibleBootstrap,
  saveBibleProgress,
  saveBibleNote,
  deleteBibleNote,
  saveBibleHighlight,
  deleteBibleHighlight,
} from "@/lib/graphql/bible/hooks";
import { toast } from "sonner";
import type {
  Translation,
  FontSize,
  FontFamily,
  LineSpacing,
  BibleBook,
  BibleChapter,
  BibleVerse,
  BibleHighlight,
  BibleNote,
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
  const [notes, setNotes] = useState<BibleNote[]>([]);
  const [highlights, setHighlights] = useState<BibleHighlight[]>([]);
  const [activeVerseForNote, setActiveVerseForNote] = useState<string | null>(null);
  const [activeVerseNumForNote, setActiveVerseNumForNote] = useState<number | null>(null);
  const [selectedVerseIds, setSelectedVerseIds] = useState<string[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
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
            setSelectedVerseIds(matched ? [matched.reference] : []);
          } else {
            setSelectedVerseIds([]);
          }
        } else {
          setSelectedVerseIds([]);
        }

        // Apply appearance from server progress if available
        if (payload.progress?.fontSize) {
          setFontSize(payload.progress.fontSize as FontSize);
        }
        if (payload.progress?.fontFamily) {
          setFontFamily(payload.progress.fontFamily as FontFamily);
        }
        if (payload.progress?.lineSpacing) {
          setLineSpacing(payload.progress.lineSpacing as LineSpacing);
        }

        // Fetch highlights and notes from Supabase for this chapter
        void (async () => {
          const supabase = getSupabaseBrowserClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const [hRes, nRes] = await Promise.all([
            supabase
              .from("bible_highlights" as any)
              .select("*")
              .eq("user_id", user.id)
              .eq("translation", payload.translation)
              .eq("book_id", payload.selectedBookId)
              .eq("chapter_id", payload.selectedChapterId),
            supabase
              .from("bible_notes" as any)
              .select("*")
              .eq("user_id", user.id)
              .eq("translation", payload.translation)
              .eq("book_id", payload.selectedBookId)
              .eq("chapter_id", payload.selectedChapterId)
          ]);

          if (hRes.data) setHighlights(hRes.data as unknown as BibleHighlight[]);
          if (nRes.data) setNotes(nRes.data as unknown as BibleNote[]);
        })();
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

  // Realtime subscription for notes and highlights
  useEffect(() => {
    if (!isBootstrapped || !bookId || !chapterId) return;

    const supabase = getSupabaseBrowserClient();
    
    const channel = supabase
      .channel(`bible-annotations-${bookId}-${chapterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bible_notes',
          filter: `chapter_id=eq.${chapterId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotes(prev => [payload.new as BibleNote, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotes(prev => prev.map(n => n.id === payload.new.id ? (payload.new as BibleNote) : n));
          } else if (payload.eventType === 'DELETE') {
            setNotes(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bible_highlights',
          filter: `chapter_id=eq.${chapterId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setHighlights(prev => [...prev, payload.new as BibleHighlight]);
          } else if (payload.eventType === 'UPDATE') {
            setHighlights(prev => prev.map(h => h.id === payload.new.id ? (payload.new as BibleHighlight) : h));
          } else if (payload.eventType === 'DELETE') {
            setHighlights(prev => prev.filter(h => h.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isBootstrapped, bookId, chapterId]);

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
  }, []);

  // Persist preferences
  useEffect(() => {
    window.localStorage.setItem("abide_bible_prefs", JSON.stringify({ fontSize, fontFamily, lineSpacing }));
  }, [fontSize, fontFamily, lineSpacing]);

  // Save progress (local + server)
  useEffect(() => {
    if (!isBootstrapped || !bookId || !chapterId) return;
    const lastSelectedId = selectedVerseIds[selectedVerseIds.length - 1];
    const activeVerseNumber =
      verses.find((verse) => verse.reference === lastSelectedId)?.verse ?? 1;
    const progress: BibleProgress = {
      translation,
      bookId,
      chapterId,
      verse: activeVerseNumber,
      fontSize,
      fontFamily,
      lineSpacing,
    };

    window.localStorage.setItem("abide_bible_progress", JSON.stringify(progress));

    const saveKey = `${progress.translation}|${progress.bookId}|${progress.chapterId}|${progress.verse}|${fontSize}|${fontFamily}|${lineSpacing}`;
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
  }, [
    isBootstrapped,
    translation,
    bookId,
    chapterId,
    verses,
    selectedVerseIds,
    fontSize,
    fontFamily,
    lineSpacing,
    getAccessToken,
  ]);

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
      toast.success(`Copied ${verse.reference}`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleOpenNote = (ref: string, verseNum: number) => {
    setActiveVerseForNote(ref);
    setActiveVerseNumForNote(verseNum);
    setNoteDraft("");
    setEditingNoteId(null);
    setIsNotesOpen(true);
  };

  const handleEditNote = (note: BibleNote) => {
    setActiveVerseForNote(`${bookId.toUpperCase()} ${selectedChapter?.number}:${note.verse_start}`);
    setActiveVerseNumForNote(note.verse_start);
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
      chapterId: chapterId,
      verseStart: activeVerseNumForNote,
      verseEnd: activeVerseNumForNote,
      content: noteDraft.trim(),
    };

    // Optimistic cleanup of draft but wait for Result for Realtime sync or manual update
    const saved = await saveBibleNote(token, input);
    
    if (saved) {
      if (!editingNoteId) {
        setNotes(prev => [saved, ...prev]);
        toast.success("Note saved");
      } else {
        setNotes(prev => prev.map(n => n.id === saved.id ? saved : n));
        toast.success("Note updated");
      }
    }

    setNoteDraft("");
    setEditingNoteId(null);
    setActiveVerseForNote(null);
    setActiveVerseNumForNote(null);
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

    const selectedVersesData = verses.filter(v => selectedVerseIds.includes(v.reference));
    const selectedNums = selectedVersesData.map(v => v.verse);
    
    const allMatching = selectedNums.every(num => {
      const h = highlights.find(h => h.verse_start === num);
      return h && h.color === color;
    });

    if (allMatching) {
      const highlightsToRemove = highlights.filter(h => selectedNums.includes(h.verse_start));
      const idsToRemove = highlightsToRemove.map(h => h.id);
      
      setHighlights(prev => prev.filter(h => !idsToRemove.includes(h.id)));
      for (const id of idsToRemove) {
        await deleteBibleHighlight(token, id);
      }
      toast.success("Highlights removed");
    } else {
      // Clear existing for these verses first
      const itemsToClear = highlights.filter(h => selectedNums.includes(h.verse_start));
      for (const h of itemsToClear) {
        await deleteBibleHighlight(token, h.id);
      }

      const newHighlights: BibleHighlight[] = [];
      for (const v of selectedVersesData) {
        const saved = await saveBibleHighlight(token, {
          translation,
          bookId,
          chapterId: chapterId,
          verseStart: v.verse,
          verseEnd: v.verse,
          color
        });
        if (saved) newHighlights.push(saved);
      }

      setHighlights(prev => {
        const others = prev.filter(h => !selectedNums.includes(h.verse_start));
        return [...others, ...newHighlights];
      });
      toast.success(`Highlighted ${selectedVerseIds.length} ${selectedVerseIds.length === 1 ? 'verse' : 'verses'}`);
    }
  };

  const handleBulkCopy = async () => {
    if (selectedVerseIds.length === 0) return;
    const selectedVersesData = verses
      .filter(v => selectedVerseIds.includes(v.reference))
      .sort((a, b) => a.verse - b.verse);
    
    const text = selectedVersesData.map(v => `${v.verse} ${v.text}`).join('\n');
    const label = `${chapterLabel}:${selectedVersesData[0].verse}${selectedVersesData.length > 1 ? `-${selectedVersesData[selectedVersesData.length-1].verse}` : ''}`;
    
    try {
      await navigator.clipboard.writeText(`${label}\n${text}`);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
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
    highlights,
    activeVerseForNote,
    selectedVerseIds,
    noteDraft,
    activeVerseNumForNote,
    editingNoteId,
    isBootstrapped,

    // Setters
    setFontSize,
    setFontFamily,
    setLineSpacing,
    setIsNavSheetOpen,
    setIsNotesOpen,
    setSelectedVerseIds,
    setNoteDraft,
    setActiveVerseForNote,
    setActiveVerseNumForNote,
    setEditingNoteId,

    // Handlers
    handlePrev,
    handleNext,
    handleCopy,
    handleOpenNote,
    handleEditNote,
    handleSaveNote,
    handleDeleteNote,
    handleBulkHighlight,
    handleBulkCopy,
    handleTranslationChange,
    handleBookChange,
    handleChapterChange,
  };
}

export type BibleState = ReturnType<typeof useBibleState>;
