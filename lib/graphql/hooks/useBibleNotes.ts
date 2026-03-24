import { useCallback } from "react";
import { getApolloClient } from "@/lib/graphql/client";
import { DELETE_BIBLE_NOTE_MUTATION, SAVE_BIBLE_NOTE_MUTATION } from "@/lib/graphql/mutations/notes";
import type { BibleNote } from "@/features/bible/types";

type SaveNoteInput = {
  translation: string;
  bookId: string;
  chapterId: string;
  verseStart: number;
  verseEnd: number;
  content: string;
};

type SaveNoteResult = {
  data: BibleNote | null;
  error: Error | null;
};

type DeleteNoteResult = {
  data: true | null;
  error: Error | null;
};

export function useBibleNotes(getAccessToken: () => Promise<string | null>) {
  const saveNote = useCallback(
    async (input: SaveNoteInput): Promise<SaveNoteResult> => {
      try {
        const token = await getAccessToken();
        if (!token) {
          return { data: null, error: null };
        }
        const client = getApolloClient();
        const { data } = await client.mutate<{
          saveBibleNote?: BibleNote;
        }>({
          mutation: SAVE_BIBLE_NOTE_MUTATION,
          variables: { input },
          context: { headers: { Authorization: `Bearer ${token}` } },
        });
        return {
          data: data?.saveBibleNote ?? null,
          error: null,
        };
      } catch (err) {
        return {
          data: null,
          error: err instanceof Error ? err : new Error("Unknown error"),
        };
      }
    },
    [getAccessToken]
  );

  const deleteNote = useCallback(
    async (id: string): Promise<DeleteNoteResult> => {
      try {
        const token = await getAccessToken();
        if (!token) {
          return { data: null, error: null };
        }
        const client = getApolloClient();
        await client.mutate({
          mutation: DELETE_BIBLE_NOTE_MUTATION,
          variables: { id },
          context: { headers: { Authorization: `Bearer ${token}` } },
        });
        return { data: true, error: null };
      } catch (err) {
        return {
          data: null,
          error: err instanceof Error ? err : new Error("Unknown error"),
        };
      }
    },
    [getAccessToken]
  );

  return { saveNote, deleteNote };
}
