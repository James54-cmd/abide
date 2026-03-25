"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type {
  Translation,
  BibleHighlight,
  BibleNote,
  BibleFavorite,
} from "@/features/bible/types";

type ChapterAnnotationParams = {
  translation: Translation;
  bookId: string;
  chapterId: string;
  isBootstrapped: boolean;
};

export function useChapterAnnotations({
  translation,
  bookId,
  chapterId,
  isBootstrapped,
}: ChapterAnnotationParams) {
  const [notes, setNotes] = useState<BibleNote[]>([]);
  const [highlights, setHighlights] = useState<BibleHighlight[]>([]);
  const [favorites, setFavorites] = useState<BibleFavorite[]>([]);

  useEffect(() => {
    if (!isBootstrapped || !bookId || !chapterId) return;

    let cancelled = false;

    async function fetchAnnotations() {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const [hRes, nRes, fRes] = await Promise.all([
        supabase
          .from("bible_highlights")
          .select("*")
          .eq("user_id", user.id)
          .eq("translation", translation)
          .eq("book_id", bookId)
          .eq("chapter_id", chapterId),
        supabase
          .from("bible_notes")
          .select("*")
          .eq("user_id", user.id)
          .eq("translation", translation)
          .eq("book_id", bookId)
          .eq("chapter_id", chapterId),
        supabase
          .from("bible_favorites")
          .select("*")
          .eq("user_id", user.id)
          .eq("translation", translation)
          .eq("book_id", bookId)
          .eq("chapter_id", chapterId),
      ]);

      if (cancelled) return;
      if (hRes.data) setHighlights(hRes.data as unknown as BibleHighlight[]);
      if (nRes.data) setNotes(nRes.data as unknown as BibleNote[]);
      if (fRes.data) setFavorites(fRes.data as unknown as BibleFavorite[]);
    }

    fetchAnnotations();
    return () => {
      cancelled = true;
    };
  }, [isBootstrapped, translation, bookId, chapterId]);

  useEffect(() => {
    if (!isBootstrapped || !bookId || !chapterId) return;

    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`bible-annotations-${bookId}-${chapterId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bible_notes",
          filter: `chapter_id=eq.${chapterId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotes((prev) => [payload.new as BibleNote, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setNotes((prev) =>
              prev.map((n) =>
                n.id === payload.new.id ? (payload.new as BibleNote) : n
              )
            );
          } else if (payload.eventType === "DELETE") {
            setNotes((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bible_highlights",
          filter: `chapter_id=eq.${chapterId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setHighlights((prev) => [
              ...prev,
              payload.new as BibleHighlight,
            ]);
          } else if (payload.eventType === "UPDATE") {
            setHighlights((prev) =>
              prev.map((h) =>
                h.id === payload.new.id
                  ? (payload.new as BibleHighlight)
                  : h
              )
            );
          } else if (payload.eventType === "DELETE") {
            setHighlights((prev) =>
              prev.filter((h) => h.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isBootstrapped, bookId, chapterId]);

  return { notes, setNotes, highlights, setHighlights, favorites, setFavorites };
}
