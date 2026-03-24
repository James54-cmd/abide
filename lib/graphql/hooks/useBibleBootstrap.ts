import { useCallback } from "react";
import { getApolloClient } from "@/lib/graphql/client";
import { BIBLE_BOOTSTRAP_QUERY } from "@/lib/graphql/queries/bible";
import type { BibleBootstrap, Translation } from "@/features/bible/types";

type FetchBootstrapArgs = {
  translation: Translation;
  preferredBookId: string | null;
  preferredChapterId: string | null;
  signal?: AbortSignal;
};

type FetchBootstrapResult = {
  data: BibleBootstrap | null;
  error: Error | null;
};

export function useBibleBootstrap(getAccessToken: () => Promise<string | null>) {
  const fetchBootstrap = useCallback(
    async (args: FetchBootstrapArgs): Promise<FetchBootstrapResult> => {
      try {
        const token = await getAccessToken();
        if (args.signal?.aborted) {
          return { data: null, error: null };
        }

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

        if (args.signal?.aborted) {
          return { data: null, error: null };
        }

        const payload = data?.bibleBootstrap;
        if (!payload) {
          return {
            data: null,
            error: new Error("Unable to bootstrap Bible data."),
          };
        }

        return { data: payload, error: null };
      } catch (err) {
        return {
          data: null,
          error: err instanceof Error ? err : new Error("Unknown error"),
        };
      }
    },
    [getAccessToken]
  );

  return { fetchBootstrap };
}
