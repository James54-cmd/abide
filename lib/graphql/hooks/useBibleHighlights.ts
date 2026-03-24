import { useCallback } from "react";
import { getApolloClient } from "@/lib/graphql/client";
import {
  DELETE_BIBLE_HIGHLIGHT_MUTATION,
  SAVE_BIBLE_HIGHLIGHT_MUTATION,
} from "@/lib/graphql/mutations/highlights";
import type { BibleHighlight } from "@/features/bible/helpers";

type SaveHighlightInput = {
  translation: string;
  bookId: string;
  chapterId: string;
  verseStart: number;
  verseEnd: number;
  color: string;
};

type SaveHighlightResult = {
  data: BibleHighlight | null;
  error: Error | null;
};

type DeleteHighlightResult = {
  data: true | null;
  error: Error | null;
};

export function useBibleHighlights(getAccessToken: () => Promise<string | null>) {
  const saveHighlight = useCallback(
    async (input: SaveHighlightInput): Promise<SaveHighlightResult> => {
      try {
        const token = await getAccessToken();
        if (!token) {
          return { data: null, error: null };
        }
        const client = getApolloClient();
        const { data } = await client.mutate<{
          saveBibleHighlight?: BibleHighlight;
        }>({
          mutation: SAVE_BIBLE_HIGHLIGHT_MUTATION,
          variables: { input },
          context: { headers: { Authorization: `Bearer ${token}` } },
        });
        return {
          data: data?.saveBibleHighlight ?? null,
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

  const deleteHighlight = useCallback(
    async (id: string): Promise<DeleteHighlightResult> => {
      try {
        const token = await getAccessToken();
        if (!token) {
          return { data: null, error: null };
        }
        const client = getApolloClient();
        await client.mutate({
          mutation: DELETE_BIBLE_HIGHLIGHT_MUTATION,
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

  return { saveHighlight, deleteHighlight };
}
