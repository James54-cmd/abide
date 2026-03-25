import { getApolloClient } from "@/lib/graphql/client";
import { BIBLE_BOOTSTRAP_QUERY } from "./queries";
import { SAVE_BIBLE_PROGRESS_MUTATION } from "./mutations";
import type {
  BibleBook,
  BibleChapter,
  BibleVerse,
  BibleProgress,
} from "@/features/bible/types";

export type BibleBootstrapPayload = {
  translation: string;
  books: BibleBook[];
  selectedBookId: string;
  chapters: BibleChapter[];
  selectedChapterId: string;
  verses: BibleVerse[];
  progress: BibleProgress | null;
};

export async function fetchBibleBootstrap(args: {
  translation: string;
  preferredBookId: string | null;
  preferredChapterId: string | null;
  token?: string | null;
  signal?: AbortSignal;
}): Promise<BibleBootstrapPayload> {
  const client = getApolloClient();
  const { data } = await client.query<{ bibleBootstrap: BibleBootstrapPayload }>({
    query: BIBLE_BOOTSTRAP_QUERY,
    variables: {
      translation: args.translation,
      preferredBookId: args.preferredBookId,
      preferredChapterId: args.preferredChapterId,
    },
    fetchPolicy: "no-cache",
    context: {
      ...(args.token ? { headers: { Authorization: `Bearer ${args.token}` } } : {}),
      ...(args.signal ? { fetchOptions: { signal: args.signal } } : {}),
    },
  });

  const payload = data?.bibleBootstrap;
  if (!payload) {
    throw new Error("Unable to bootstrap Bible data.");
  }
  return payload;
}

export async function saveBibleProgress(
  token: string,
  input: BibleProgress
) {
  const client = getApolloClient();
  await client.mutate({
    mutation: SAVE_BIBLE_PROGRESS_MUTATION,
    variables: { input },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
}
