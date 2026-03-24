import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import {
  apiBibleGetCached,
  getBibleIdForTranslation,
  mapBibleBooksData,
  mapBibleChaptersData,
  mapVersesFromVerseList,
  normalizeText,
} from "@/lib/server/api-bible";
import { getSafeAuthRedirectUrl } from "@/lib/auth/redirect";
import { generateEncouragementForUser } from "@/lib/server/chat-generation";
import { requireUserFromAuthHeader } from "@/lib/server/supabase-admin";

type Translation = "NIV" | "NLT";

type GraphQlContext = {
  authHeader: string | null;
};

const DEFAULT_TRANSLATION: Translation = "NIV";

function mapChatMessagesFromRows(
  rows: {
    id: number;
    role: string;
    content: string;
    encouragement: unknown;
    created_at: string;
  }[]
) {
  return rows.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    encouragement: message.encouragement,
    createdAt: message.created_at,
  }));
}

async function safeFetchChaptersForBook(bibleId: string, bookId: string): Promise<unknown | null> {
  try {
    return await apiBibleGetCached(`/v1/bibles/${bibleId}/books/${bookId}/chapters`);
  } catch {
    return null;
  }
}

function splitChapterIntoVerses(rawText: string, chapterId: string) {
  const text = normalizeText(rawText);

  const pattern = /\[(\d+)\]/g;
  const markers: { verse: number; index: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    markers.push({ verse: Number(match[1]), index: match.index });
  }

  if (markers.length === 0) {
    return [{ reference: chapterId, text, verse: 1 }];
  }

  const bookPart = chapterId.replace(/\.\d+$/, "");
  const chapterNum = chapterId.split(".").pop() ?? "";
  const chapterRef = `${bookPart} ${chapterNum}`.replace(/\./g, " ");

  return markers
    .map((marker, idx) => {
      const start = marker.index + `[${marker.verse}]`.length;
      const end = idx < markers.length - 1 ? markers[idx + 1].index : text.length;
      const verseText = text.slice(start, end).trim();
      return {
        reference: `${chapterRef}:${marker.verse}`,
        text: verseText,
        verse: marker.verse,
      };
    })
    .filter((v) => v.text.length > 0);
}

const typeDefs = `
  input SignUpInput {
    fullName: String!
    email: String!
    password: String!
    redirectTo: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type AuthPayload {
    success: Boolean!
    message: String
    accessToken: String
    refreshToken: String
  }

  type BibleBook {
    id: String!
    name: String!
  }

  type BibleChapter {
    id: String!
    number: Int!
  }

  type BibleVerse {
    reference: String!
    text: String!
    verse: Int!
  }

  type BibleProgress {
    translation: String!
    bookId: String!
    chapterId: String!
    verse: Int!
    updatedAt: String
  }

  type BibleHighlight {
    id: String!
    translation: String!
    bookId: String!
    chapterId: String!
    verseStart: Int!
    verseEnd: Int!
    color: String!
    createdAt: String!
    updatedAt: String!
  }

  type BibleNote {
    id: String!
    translation: String!
    bookId: String!
    chapterId: String!
    verseStart: Int!
    verseEnd: Int!
    content: String!
    createdAt: String!
    updatedAt: String!
  }

  type BibleAnnotationsPayload {
    highlights: [BibleHighlight!]!
    notes: [BibleNote!]!
  }

  type BibleBootstrapPayload {
    translation: String!
    books: [BibleBook!]!
    selectedBookId: String!
    chapters: [BibleChapter!]!
    selectedChapterId: String!
    verses: [BibleVerse!]!
    progress: BibleProgress
  }

  type ChatConversation {
    id: String!
    title: String!
    updatedAt: String!
    createdAt: String!
  }

  type EncouragementVerse {
    reference: String!
    text: String!
  }

  type Encouragement {
    intro: String!
    verses: [EncouragementVerse!]!
    closing: String!
  }

  type ChatMessage {
    id: Int!
    role: String!
    content: String!
    encouragement: Encouragement
    createdAt: String!
  }

  type ChatBootstrapPayload {
    conversations: [ChatConversation!]!
    messages: [ChatMessage!]!
    activeConversationId: String
  }

  input GenerateEncouragementInput {
    message: String!
    conversationId: String
  }

  type GenerateEncouragementPayload {
    conversationId: String!
    encouragement: Encouragement!
  }

  input SaveBibleProgressInput {
    translation: String!
    bookId: String!
    chapterId: String!
    verse: Int
  }

  input SaveBibleHighlightInput {
    id: String
    translation: String!
    bookId: String!
    chapterId: String!
    verseStart: Int!
    verseEnd: Int!
    color: String
  }

  input SaveBibleNoteInput {
    id: String
    translation: String!
    bookId: String!
    chapterId: String!
    verseStart: Int!
    verseEnd: Int!
    content: String!
  }

  type Mutation {
    signUp(input: SignUpInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    saveBibleProgress(input: SaveBibleProgressInput!): BibleProgress!
    saveBibleHighlight(input: SaveBibleHighlightInput!): BibleHighlight!
    deleteBibleHighlight(id: String!): Boolean!
    saveBibleNote(input: SaveBibleNoteInput!): BibleNote!
    deleteBibleNote(id: String!): Boolean!
    deleteChatConversation(id: String!): Boolean!
    generateEncouragement(input: GenerateEncouragementInput!): GenerateEncouragementPayload!
  }

  type Query {
    health: String!
    bibleBootstrap(
      translation: String
      preferredBookId: String
      preferredChapterId: String
    ): BibleBootstrapPayload!
    bibleAnnotations(
      translation: String!
      bookId: String!
      chapterId: String!
    ): BibleAnnotationsPayload!
    chatBootstrap(
      conversationId: String
      includeMessages: Boolean
    ): ChatBootstrapPayload!
  }
`;

const resolvers = {
  Query: {
    health: () => "ok",
    bibleBootstrap: async (
      _: unknown,
      args: {
        translation?: string;
        preferredBookId?: string | null;
        preferredChapterId?: string | null;
      },
      context: GraphQlContext
    ) => {
      const requestedTranslation =
        (args.translation?.toUpperCase() as Translation | undefined) || DEFAULT_TRANSLATION;
      if (!["NIV", "NLT"].includes(requestedTranslation)) {
        throw new Error("Invalid translation.");
      }

      let progress: {
        translation: Translation;
        bookId: string;
        chapterId: string;
        verse: number;
        updatedAt?: string | null;
      } | null = null;

      try {
        const { user, supabase } = await requireUserFromAuthHeader(context.authHeader);
        const { data, error } = await supabase
          .from("bible_reading_progress")
          .select("translation,book_id,chapter_id,verse,updated_at")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data && (data.translation === "NIV" || data.translation === "NLT")) {
          progress = {
            translation: data.translation,
            bookId: data.book_id,
            chapterId: data.chapter_id,
            verse: data.verse,
            updatedAt: data.updated_at,
          };
        }
      } catch {
        // Unauthenticated requests still return bootstrap payload using preferred params.
      }

      const translation = requestedTranslation;
      const progressForTranslation =
        progress && progress.translation === translation ? progress : null;

      const argBook = args.preferredBookId?.trim() || "";
      const preferredBookId =
        argBook || progressForTranslation?.bookId || "";

      const bibleId = getBibleIdForTranslation(translation);

      const [booksData, earlyChaptersData] = await Promise.all([
        apiBibleGetCached(`/v1/bibles/${bibleId}/books`),
        preferredBookId ? safeFetchChaptersForBook(bibleId, preferredBookId) : Promise.resolve(null),
      ]);

      const books = mapBibleBooksData(booksData);

      const selectedBookId =
        books.find((book) => book.id === preferredBookId)?.id ?? books[0]?.id ?? "";

      if (!selectedBookId) {
        return {
          translation,
          books: [],
          selectedBookId: "",
          chapters: [],
          selectedChapterId: "",
          verses: [],
          progress: progress
            ? {
                translation: progress.translation,
                bookId: progress.bookId,
                chapterId: progress.chapterId,
                verse: progress.verse,
                updatedAt: progress.updatedAt ?? null,
              }
            : null,
        };
      }

      let chapters = mapBibleChaptersData(
        selectedBookId === preferredBookId && earlyChaptersData !== null
          ? earlyChaptersData
          : await apiBibleGetCached(`/v1/bibles/${bibleId}/books/${selectedBookId}/chapters`)
      );

      const argChapter = args.preferredChapterId?.trim() || "";
      const chapterFromProgress =
        progressForTranslation && progressForTranslation.bookId === selectedBookId
          ? progressForTranslation.chapterId
          : "";
      const preferredChapterId = argChapter || chapterFromProgress || "";

      const selectedChapterId =
        chapters.find((chapter) => chapter.id === preferredChapterId)?.id ??
        chapters[0]?.id ??
        "";

      let verses: { reference: string; text: string; verse: number }[] = [];
      if (selectedChapterId) {
        const versesData = await apiBibleGetCached(
          `/v1/bibles/${bibleId}/chapters/${selectedChapterId}/verses`
        );
        const versesWithText = mapVersesFromVerseList(versesData, selectedChapterId);

        verses =
          versesWithText.length > 1
            ? versesWithText
            : splitChapterIntoVerses(
                String(
                  (
                    (await apiBibleGetCached(
                      `/v1/bibles/${bibleId}/chapters/${selectedChapterId}?content-type=text`
                    )) as Record<string, unknown>
                  ).content ?? ""
                ),
                selectedChapterId
              );
      }

      return {
        translation,
        books,
        selectedBookId,
        chapters,
        selectedChapterId,
        verses,
        progress: progress
          ? {
              translation: progress.translation,
              bookId: progress.bookId,
              chapterId: progress.chapterId,
              verse: progress.verse,
              updatedAt: progress.updatedAt ?? null,
            }
          : null,
      };
    },
    bibleAnnotations: async (
      _: unknown,
      args: { translation: string; bookId: string; chapterId: string },
      context: GraphQlContext
    ) => {
      const { user, supabase } = await requireUserFromAuthHeader(context.authHeader);
      const translation = args.translation.toUpperCase();
      if (!["NIV", "NLT"].includes(translation)) {
        throw new Error("Invalid translation.");
      }
      const bookId = args.bookId?.trim();
      const chapterId = args.chapterId?.trim();
      if (!bookId || !chapterId) {
        throw new Error("bookId and chapterId are required.");
      }

      const [highlightsRes, notesRes] = await Promise.all([
        supabase
          .from("bible_highlights")
          .select("id,translation,book_id,chapter_id,verse_start,verse_end,color,created_at,updated_at")
          .eq("user_id", user.id)
          .eq("translation", translation)
          .eq("book_id", bookId)
          .eq("chapter_id", chapterId)
          .order("verse_start", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("bible_notes")
          .select("id,translation,book_id,chapter_id,verse_start,verse_end,content,created_at,updated_at")
          .eq("user_id", user.id)
          .eq("translation", translation)
          .eq("book_id", bookId)
          .eq("chapter_id", chapterId)
          .order("verse_start", { ascending: true })
          .order("created_at", { ascending: false }),
      ]);

      if (highlightsRes.error) throw highlightsRes.error;
      if (notesRes.error) throw notesRes.error;

      return {
        highlights: (highlightsRes.data ?? []).map((row) => ({
          id: row.id,
          translation: row.translation,
          bookId: row.book_id,
          chapterId: row.chapter_id,
          verseStart: row.verse_start,
          verseEnd: row.verse_end,
          color: row.color ?? "gold",
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
        notes: (notesRes.data ?? []).map((row) => ({
          id: row.id,
          translation: row.translation,
          bookId: row.book_id,
          chapterId: row.chapter_id,
          verseStart: row.verse_start,
          verseEnd: row.verse_end,
          content: row.content,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      };
    },
    chatBootstrap: async (
      _: unknown,
      args: { conversationId?: string | null; includeMessages?: boolean | null },
      context: GraphQlContext
    ) => {
      const { user, supabase } = await requireUserFromAuthHeader(context.authHeader);
      const includeMessages = args.includeMessages !== false;

      const { data: convRows, error: convError } = await supabase
        .from("chat_conversations")
        .select("id,title,updated_at,created_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (convError) throw convError;

      const conversations = (convRows ?? []).map((conversation) => ({
        id: conversation.id,
        title: conversation.title ?? "New conversation",
        updatedAt: conversation.updated_at,
        createdAt: conversation.created_at,
      }));

      const requestedId = args.conversationId?.trim() ?? "";
      const activeConversationId =
        requestedId && conversations.some((c) => c.id === requestedId)
          ? requestedId
          : conversations[0]?.id ?? null;

      let messages: {
        id: number;
        role: string;
        content: string;
        encouragement: unknown;
        createdAt: string;
      }[] = [];

      if (includeMessages && activeConversationId) {
        const { data: msgRows, error: msgError } = await supabase
          .from("chat_messages")
          .select("id,role,content,encouragement,created_at")
          .eq("conversation_id", activeConversationId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (msgError) throw msgError;
        messages = mapChatMessagesFromRows(
          (msgRows ?? []) as {
            id: number;
            role: string;
            content: string;
            encouragement: unknown;
            created_at: string;
          }[]
        );
      }

      return {
        conversations,
        messages,
        activeConversationId,
      };
    },
  },
  Mutation: {
    signUp: async (
      _: unknown,
      args: {
        input: {
          fullName: string;
          email: string;
          password: string;
          redirectTo?: string | null;
        };
      }
    ) => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase env vars are missing.");
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { fullName, email, password, redirectTo } = args.input;
      const safeRedirectTo = getSafeAuthRedirectUrl({
        requestedRedirectTo: redirectTo,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          ...(safeRedirectTo ? { emailRedirectTo: safeRedirectTo } : {}),
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: data.session
          ? "Account created."
          : "Account created. Please check your email to confirm your signup.",
        accessToken: data.session?.access_token ?? null,
        refreshToken: data.session?.refresh_token ?? null,
      };
    },
    login: async (
      _: unknown,
      args: {
        input: {
          email: string;
          password: string;
        };
      }
    ) => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase env vars are missing.");
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.signInWithPassword(args.input);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: "Logged in successfully.",
        accessToken: data.session?.access_token ?? null,
        refreshToken: data.session?.refresh_token ?? null,
      };
    },
    saveBibleProgress: async (
      _: unknown,
      args: {
        input: {
          translation: string;
          bookId: string;
          chapterId: string;
          verse?: number | null;
        };
      },
      context: GraphQlContext
    ) => {
      const { user, supabase } = await requireUserFromAuthHeader(context.authHeader);
      const translation = args.input.translation.toUpperCase();
      if (!["NIV", "NLT"].includes(translation)) {
        throw new Error("Invalid translation.");
      }
      if (!args.input.bookId?.trim()) {
        throw new Error("bookId is required.");
      }
      if (!args.input.chapterId?.trim()) {
        throw new Error("chapterId is required.");
      }

      const verse =
        typeof args.input.verse === "number" &&
        Number.isFinite(args.input.verse) &&
        args.input.verse > 0
          ? Math.floor(args.input.verse)
          : 1;

      const { data, error } = await supabase
        .from("bible_reading_progress")
        .upsert(
          {
            user_id: user.id,
            translation,
            book_id: args.input.bookId.trim(),
            chapter_id: args.input.chapterId.trim(),
            verse,
          },
          { onConflict: "user_id" }
        )
        .select("translation,book_id,chapter_id,verse,updated_at")
        .single();

      if (error) throw error;
      return {
        translation: data.translation,
        bookId: data.book_id,
        chapterId: data.chapter_id,
        verse: data.verse,
        updatedAt: data.updated_at,
      };
    },
    saveBibleHighlight: async (
      _: unknown,
      args: {
        input: {
          id?: string | null;
          translation: string;
          bookId: string;
          chapterId: string;
          verseStart: number;
          verseEnd: number;
          color?: string | null;
        };
      },
      context: GraphQlContext
    ) => {
      const { user, supabase } = await requireUserFromAuthHeader(context.authHeader);
      const translation = args.input.translation.toUpperCase();
      if (!["NIV", "NLT"].includes(translation)) throw new Error("Invalid translation.");
      const bookId = args.input.bookId?.trim();
      const chapterId = args.input.chapterId?.trim();
      if (!bookId || !chapterId) throw new Error("bookId and chapterId are required.");
      const start = Math.max(1, Math.floor(args.input.verseStart));
      const end = Math.max(start, Math.floor(args.input.verseEnd));
      const color = args.input.color?.trim() || "gold";

      const payload = {
        user_id: user.id,
        translation,
        book_id: bookId,
        chapter_id: chapterId,
        verse_start: start,
        verse_end: end,
        color,
      };

      const query = args.input.id?.trim()
        ? supabase.from("bible_highlights").update(payload).eq("id", args.input.id.trim())
        : supabase.from("bible_highlights").insert(payload);
      const { data, error } = await query
        .select("id,translation,book_id,chapter_id,verse_start,verse_end,color,created_at,updated_at")
        .single();
      if (error) throw error;
      return {
        id: data.id,
        translation: data.translation,
        bookId: data.book_id,
        chapterId: data.chapter_id,
        verseStart: data.verse_start,
        verseEnd: data.verse_end,
        color: data.color ?? "gold",
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    deleteBibleHighlight: async (_: unknown, args: { id: string }, context: GraphQlContext) => {
      const { user, supabase } = await requireUserFromAuthHeader(context.authHeader);
      const id = args.id?.trim();
      if (!id) throw new Error("id is required.");
      const { error } = await supabase
        .from("bible_highlights")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      return true;
    },
    saveBibleNote: async (
      _: unknown,
      args: {
        input: {
          id?: string | null;
          translation: string;
          bookId: string;
          chapterId: string;
          verseStart: number;
          verseEnd: number;
          content: string;
        };
      },
      context: GraphQlContext
    ) => {
      const { user, supabase } = await requireUserFromAuthHeader(context.authHeader);
      const translation = args.input.translation.toUpperCase();
      if (!["NIV", "NLT"].includes(translation)) throw new Error("Invalid translation.");
      const bookId = args.input.bookId?.trim();
      const chapterId = args.input.chapterId?.trim();
      if (!bookId || !chapterId) throw new Error("bookId and chapterId are required.");
      const content = args.input.content?.trim();
      if (!content) throw new Error("content is required.");
      const start = Math.max(1, Math.floor(args.input.verseStart));
      const end = Math.max(start, Math.floor(args.input.verseEnd));

      const payload = {
        user_id: user.id,
        translation,
        book_id: bookId,
        chapter_id: chapterId,
        verse_start: start,
        verse_end: end,
        content,
      };

      const query = args.input.id?.trim()
        ? supabase.from("bible_notes").update(payload).eq("id", args.input.id.trim())
        : supabase.from("bible_notes").insert(payload);
      const { data, error } = await query
        .select("id,translation,book_id,chapter_id,verse_start,verse_end,content,created_at,updated_at")
        .single();
      if (error) throw error;
      return {
        id: data.id,
        translation: data.translation,
        bookId: data.book_id,
        chapterId: data.chapter_id,
        verseStart: data.verse_start,
        verseEnd: data.verse_end,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    deleteBibleNote: async (_: unknown, args: { id: string }, context: GraphQlContext) => {
      const { user, supabase } = await requireUserFromAuthHeader(context.authHeader);
      const id = args.id?.trim();
      if (!id) throw new Error("id is required.");
      const { error } = await supabase
        .from("bible_notes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      return true;
    },
    deleteChatConversation: async (
      _: unknown,
      args: { id: string },
      context: GraphQlContext
    ) => {
      const { user, supabase } = await requireUserFromAuthHeader(context.authHeader);
      const id = args.id?.trim();
      if (!id) throw new Error("Conversation id is required.");

      const { data: conversation, error: convError } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (convError || !conversation) {
        throw new Error("Conversation not found.");
      }

      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      return true;
    },
    generateEncouragement: async (
      _: unknown,
      args: { input: { message: string; conversationId?: string | null } },
      context: GraphQlContext
    ) => {
      const result = await generateEncouragementForUser({
        authHeader: context.authHeader,
        message: args.input.message,
        conversationId: args.input.conversationId ?? null,
      });
      return {
        conversationId: result.conversationId,
        encouragement: result.encouragement,
      };
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler<NextRequest, GraphQlContext>(server, {
  context: async (req) => ({
    authHeader: req.headers.get("authorization"),
  }),
});

export { handler as GET, handler as POST };
