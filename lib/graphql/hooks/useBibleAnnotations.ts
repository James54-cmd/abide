import { useCallback } from "react";
import { getApolloClient } from "@/lib/graphql/client";
import { BIBLE_ANNOTATIONS_QUERY } from "@/lib/graphql/queries/bible";
import type { BibleHighlight } from "@/features/bible/helpers";
import type { BibleNote } from "@/features/bible/types";

type BibleAnnotationsResult = {
  highlights: BibleHighlight[];
  notes: BibleNote[];
};

type FetchArgs = {
  translation: string;
  bookId: string;
  chapterId: string;
};

type FetchResult = {
  data: BibleAnnotationsResult | null;
  error: Error | null;
};

export function useBibleAnnotations(getAccessToken: () => Promise<string | null>) {
  const fetchAnnotations = useCallback(
    async (vars: FetchArgs, signal?: AbortSignal): Promise<FetchResult> => {
      try {
        const token = await getAccessToken();

        if (!token || signal?.aborted) {
          return { data: null, error: null };
        }

        const client = getApolloClient();

        const { data } = await client.query<{
          bibleAnnotations?: BibleAnnotationsResult;
        }>({
          query: BIBLE_ANNOTATIONS_QUERY,
          variables: vars,
          fetchPolicy: "no-cache",
          context: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            ...(signal ? { fetchOptions: { signal } } : {}),
          },
        });

        if (signal?.aborted) {
          return { data: null, error: null };
        }

        return {
          data: data?.bibleAnnotations ?? null,
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

  return { fetchAnnotations };
}
