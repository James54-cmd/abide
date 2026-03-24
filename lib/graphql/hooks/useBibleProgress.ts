import { useCallback } from "react";
import { getApolloClient } from "@/lib/graphql/client";
import { SAVE_BIBLE_PROGRESS_MUTATION } from "@/lib/graphql/mutations/bible";
import {
  lastServerSavedProgressKey,
  resetBibleProgressDedupeKey,
  setBibleProgressDedupeKey,
} from "@/lib/graphql/bible-progress-dedupe";
import type { BibleProgress } from "@/features/bible/types";

type SaveProgressResult = {
  data: true | null;
  error: Error | null;
};

export function useBibleProgress(getAccessToken: () => Promise<string | null>) {
  const saveProgress = useCallback(
    async (progress: BibleProgress): Promise<SaveProgressResult> => {
      const saveKey = `${progress.translation}|${progress.bookId}|${progress.chapterId}|${progress.verse}`;
      if (lastServerSavedProgressKey === saveKey) {
        return { data: null, error: null };
      }
      setBibleProgressDedupeKey(saveKey);

      try {
        const token = await getAccessToken();
        if (!token) {
          return { data: null, error: null };
        }
        const client = getApolloClient();
        await client.mutate({
          mutation: SAVE_BIBLE_PROGRESS_MUTATION,
          variables: {
            input: progress,
          },
          context: { headers: { Authorization: `Bearer ${token}` } },
        });
        return { data: true, error: null };
      } catch (err) {
        resetBibleProgressDedupeKey();
        return {
          data: null,
          error: err instanceof Error ? err : new Error("Unknown error"),
        };
      }
    },
    [getAccessToken]
  );

  return { saveProgress };
}
