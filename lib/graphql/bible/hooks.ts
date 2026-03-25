import { getApolloClient } from "@/lib/graphql/client";
import { BIBLE_BOOTSTRAP_QUERY, BIBLE_FAVORITES_QUERY } from "./queries";
import { 
  SAVE_BIBLE_PROGRESS_MUTATION,
  SAVE_BIBLE_NOTE_MUTATION,
  DELETE_BIBLE_NOTE_MUTATION,
  BULK_SAVE_BIBLE_NOTES_MUTATION,
  BULK_DELETE_BIBLE_NOTES_MUTATION,
  SAVE_BIBLE_FAVORITE_MUTATION,
  DELETE_BIBLE_FAVORITE_MUTATION,
  BULK_SAVE_BIBLE_FAVORITES_MUTATION,
  BULK_DELETE_BIBLE_FAVORITES_MUTATION,
  SAVE_BIBLE_HIGHLIGHT_MUTATION,
  DELETE_BIBLE_HIGHLIGHT_MUTATION,
  BULK_SAVE_BIBLE_HIGHLIGHTS_MUTATION,
  BULK_DELETE_BIBLE_HIGHLIGHTS_MUTATION
} from "./mutations";
import {
  BibleBook,
  BibleChapter,
  BibleVerse,
  BibleHighlight,
  BibleFavorite,
  BibleNote,
  BibleProgress,
  Translation,
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

export async function saveBibleNote(
  token: string,
  input: {
    id?: string | null;
    translation: string;
    bookId: string;
    chapterId: string;
    verseStart: number;
    verseEnd: number;
    content: string;
  }
) {
  const client = getApolloClient();
  const { data } = await client.mutate<{ saveBibleNote: any }>({
    mutation: SAVE_BIBLE_NOTE_MUTATION,
    variables: { input },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const raw = data?.saveBibleNote;
  if (!raw) return undefined;
  // Map camelCase from GraphQL back to snake_case for local BibleNote type
  return {
    id: raw.id,
    translation: raw.translation as Translation,
    book_id: raw.bookId,
    chapter_id: raw.chapterId,
    verse_start: raw.verseStart,
    verse_end: raw.verseEnd,
    content: raw.content,
    created_at: raw.createdAt,
    updated_at: raw.updatedAt,
  } as BibleNote;
}

export async function deleteBibleNote(
  token: string,
  id: string
) {
  const client = getApolloClient();
  await client.mutate({
    mutation: DELETE_BIBLE_NOTE_MUTATION,
    variables: { id },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function bulkSaveBibleNotes(
  token: string,
  inputs: {
    translation: string;
    bookId: string;
    chapterId: string;
    verseStart: number;
    verseEnd: number;
    content: string;
  }[]
) {
  const client = getApolloClient();
  const { data } = await client.mutate<{ bulkSaveBibleNotes: any[] }>({
    mutation: BULK_SAVE_BIBLE_NOTES_MUTATION,
    variables: { inputs },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const raw = data?.bulkSaveBibleNotes;
  if (!raw) return [];
  return raw.map(item => ({
    id: item.id,
    translation: item.translation as Translation,
    book_id: item.bookId,
    chapter_id: item.chapterId,
    verse_start: item.verseStart,
    verse_end: item.verseEnd,
    content: item.content,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  } as BibleNote));
}

export async function bulkDeleteBibleNotes(
  token: string,
  ids: string[]
) {
  const client = getApolloClient();
  await client.mutate({
    mutation: BULK_DELETE_BIBLE_NOTES_MUTATION,
    variables: { ids },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function saveBibleHighlight(
  token: string,
  input: {
    id?: string | null;
    translation: string;
    bookId: string;
    chapterId: string;
    verseStart: number;
    verseEnd: number;
    color: string;
  }
) {
  const client = getApolloClient();
  const { data } = await client.mutate<{ saveBibleHighlight: any }>({
    mutation: SAVE_BIBLE_HIGHLIGHT_MUTATION,
    variables: { input },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const raw = data?.saveBibleHighlight;
  if (!raw) return undefined;
  // Map camelCase from GraphQL back to snake_case for local BibleHighlight type
  return {
    id: raw.id,
    translation: raw.translation as Translation,
    book_id: raw.bookId,
    chapter_id: raw.chapterId,
    verse_start: raw.verseStart,
    verse_end: raw.verseEnd,
    color: raw.color,
    created_at: raw.createdAt,
    updated_at: raw.updatedAt,
  } as BibleHighlight;
}

export async function deleteBibleHighlight(
  token: string,
  id: string
) {
  const client = getApolloClient();
  await client.mutate({
    mutation: DELETE_BIBLE_HIGHLIGHT_MUTATION,
    variables: { id },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function fetchBibleFavorites(token: string) {
  const client = getApolloClient();
  const { data } = await client.query<{ bibleFavorites: any[] }>({
    query: BIBLE_FAVORITES_QUERY,
    context: { headers: { Authorization: `Bearer ${token}` } },
    fetchPolicy: "no-cache"
  });
  const raw = data?.bibleFavorites;
  if (!raw) return [];
  return raw.map(item => ({
    id: item.id,
    translation: item.translation as Translation,
    book_id: item.bookId,
    book_name: item.bookName,
    chapter_id: item.chapterId,
    verse_start: item.verseStart,
    verse_end: item.verseEnd,
    verse_reference: item.verseReference,
    verse_text: item.verseText,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  } as BibleFavorite));
}

export async function saveBibleFavorite(
  token: string,
  input: {
    id?: string | null;
    translation: string;
    bookId: string;
    chapterId: string;
    verseStart: number;
    verseEnd: number;
    verseReference: string;
    verseText: string;
  }
) {
  const client = getApolloClient();
  const { data } = await client.mutate<{ saveBibleFavorite: any }>({
    mutation: SAVE_BIBLE_FAVORITE_MUTATION,
    variables: { input },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const raw = data?.saveBibleFavorite;
  if (!raw) return undefined;
  return {
    id: raw.id,
    translation: raw.translation as Translation,
    book_id: raw.bookId,
    book_name: raw.bookName,
    chapter_id: raw.chapterId,
    verse_start: raw.verseStart,
    verse_end: raw.verseEnd,
    verse_reference: raw.verseReference,
    verse_text: raw.verseText,
    created_at: raw.createdAt,
    updated_at: raw.updatedAt,
  } as BibleFavorite;
}

export async function deleteBibleFavorite(
  token: string,
  id: string
) {
  const client = getApolloClient();
  await client.mutate({
    mutation: DELETE_BIBLE_FAVORITE_MUTATION,
    variables: { id },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function bulkSaveBibleFavorites(
  token: string,
  inputs: {
    translation: string;
    bookId: string;
    chapterId: string;
    verseStart: number;
    verseEnd: number;
    verseReference: string;
    verseText: string;
  }[]
) {
  const client = getApolloClient();
  const { data } = await client.mutate<{ bulkSaveBibleFavorites: any[] }>({
    mutation: BULK_SAVE_BIBLE_FAVORITES_MUTATION,
    variables: { inputs },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const raw = data?.bulkSaveBibleFavorites;
  if (!raw) return [];
  return raw.map(item => ({
    id: item.id,
    translation: item.translation as Translation,
    book_id: item.bookId,
    book_name: item.bookName,
    chapter_id: item.chapterId,
    verse_start: item.verseStart,
    verse_end: item.verseEnd,
    verse_reference: item.verseReference,
    verse_text: item.verseText,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  } as BibleFavorite));
}

export async function bulkDeleteBibleFavorites(
  token: string,
  ids: string[]
) {
  const client = getApolloClient();
  await client.mutate({
    mutation: BULK_DELETE_BIBLE_FAVORITES_MUTATION,
    variables: { ids },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function bulkSaveBibleHighlights(
  token: string,
  inputs: {
    translation: string;
    bookId: string;
    chapterId: string;
    verseStart: number;
    verseEnd: number;
    color: string;
  }[]
) {
  const client = getApolloClient();
  const { data } = await client.mutate<{ bulkSaveBibleHighlights: any[] }>({
    mutation: BULK_SAVE_BIBLE_HIGHLIGHTS_MUTATION,
    variables: { inputs },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const raw = data?.bulkSaveBibleHighlights;
  if (!raw) return [];
  return raw.map(item => ({
    id: item.id,
    translation: item.translation as Translation,
    book_id: item.bookId,
    chapter_id: item.chapterId,
    verse_start: item.verseStart,
    verse_end: item.verseEnd,
    color: item.color,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  } as BibleHighlight));
}

export async function bulkDeleteBibleHighlights(
  token: string,
  ids: string[]
) {
  const client = getApolloClient();
  await client.mutate({
    mutation: BULK_DELETE_BIBLE_HIGHLIGHTS_MUTATION,
    variables: { ids },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
}
