import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import {
  apiBibleGet,
  getBibleIdForTranslation,
  normalizeText,
  toItemArray,
} from "@/lib/server/api-bible";
import { getSiteUrl, getSupabasePublicEnv } from "@/lib/env";
import { getSafeAuthRedirectUrl } from "@/lib/auth/redirect";
import { requireUserFromAuthHeader } from "@/lib/server/supabase-admin";

type Translation = "NIV" | "NLT";

type GraphQlContext = {
  authHeader: string | null;
};

const DEFAULT_TRANSLATION: Translation = "NIV";

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

  input SaveBibleProgressInput {
    translation: String!
    bookId: String!
    chapterId: String!
    verse: Int
  }

  type Mutation {
    signUp(input: SignUpInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    saveBibleProgress(input: SaveBibleProgressInput!): BibleProgress!
  }

  type Query {
    health: String!
    bibleBooks(translation: String): [BibleBook!]!
    bibleChapters(translation: String, bookId: String!): [BibleChapter!]!
    bibleVerses(translation: String, chapterId: String!): [BibleVerse!]!
    bibleProgress: BibleProgress
  }
`;

const resolvers = {
  Query: {
    health: () => "ok",
    bibleBooks: async (
      _: unknown,
      args: { translation?: string }
    ) => {
      const translation = (args.translation?.toUpperCase() as Translation) || DEFAULT_TRANSLATION;
      if (!["NIV", "NLT"].includes(translation)) {
        throw new Error("Invalid translation.");
      }

      const bibleId = getBibleIdForTranslation(translation);
      const booksData = await apiBibleGet(`/v1/bibles/${bibleId}/books`);
      return toItemArray(booksData)
        .map((item) => ({
          id: String(item.id ?? ""),
          name: String(item.name ?? ""),
        }))
        .filter((item) => item.id && item.name);
    },
    bibleChapters: async (
      _: unknown,
      args: { translation?: string; bookId: string }
    ) => {
      const translation = (args.translation?.toUpperCase() as Translation) || DEFAULT_TRANSLATION;
      if (!["NIV", "NLT"].includes(translation)) {
        throw new Error("Invalid translation.");
      }
      if (!args.bookId?.trim()) {
        throw new Error("bookId is required.");
      }

      const bibleId = getBibleIdForTranslation(translation);
      const chaptersData = await apiBibleGet(`/v1/bibles/${bibleId}/books/${args.bookId}/chapters`);
      return toItemArray(chaptersData)
        .map((item) => {
          const id = String(item.id ?? "");
          const rawNumber = item.number ?? item.chapter ?? null;
          const numberFromField =
            typeof rawNumber === "string" || typeof rawNumber === "number"
              ? Number(rawNumber)
              : NaN;
          const numberFromId = Number(id.split(".").pop());
          const number = Number.isFinite(numberFromField) ? numberFromField : numberFromId;
          return { id, number };
        })
        .filter((item) => item.id && Number.isFinite(item.number))
        .sort((a, b) => a.number - b.number);
    },
    bibleVerses: async (
      _: unknown,
      args: { translation?: string; chapterId: string }
    ) => {
      const translation = (args.translation?.toUpperCase() as Translation) || DEFAULT_TRANSLATION;
      if (!["NIV", "NLT"].includes(translation)) {
        throw new Error("Invalid translation.");
      }
      if (!args.chapterId?.trim()) {
        throw new Error("chapterId is required.");
      }

      const bibleId = getBibleIdForTranslation(translation);
      const chapterId = args.chapterId.trim();

      const versesData = await apiBibleGet(`/v1/bibles/${bibleId}/chapters/${chapterId}/verses`);
      const verseList = toItemArray(versesData);

      const versesWithText = verseList
        .map((item, index) => {
          const reference = String(item.reference ?? "");
          const text = normalizeText(item.content ?? item.text ?? "");
          const num = Number(item.verse ?? item.number ?? item.orgId ?? index + 1);
          const numFromRef = Number(reference.split(":").pop());
          const verse = Number.isFinite(num)
            ? num
            : Number.isFinite(numFromRef)
              ? numFromRef
              : index + 1;
          return { reference: reference || `${chapterId}:${verse}`, text, verse };
        })
        .filter((v) => v.text.length > 0);

      if (versesWithText.length > 1) {
        return versesWithText;
      }

      const chapterData = (await apiBibleGet(
        `/v1/bibles/${bibleId}/chapters/${chapterId}?content-type=text`
      )) as Record<string, unknown>;
      const chapterText = String(chapterData.content ?? "");
      return splitChapterIntoVerses(chapterText, chapterId);
    },
    bibleProgress: async (
      _: unknown,
      __: unknown,
      context: GraphQlContext
    ) => {
      const { user, supabase } = await requireUserFromAuthHeader(context.authHeader);
      const { data, error } = await supabase
        .from("bible_reading_progress")
        .select("translation,book_id,chapter_id,verse,updated_at")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }
      if (!data) return null;

      return {
        translation: data.translation,
        bookId: data.book_id,
        chapterId: data.chapter_id,
        verse: data.verse,
        updatedAt: data.updated_at,
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
      const { url, anonKey } = getSupabasePublicEnv();
      const supabase = createClient(url, anonKey);
      const { fullName, email, password, redirectTo } = args.input;
      let siteUrl: string | null = null;
      try {
        siteUrl = getSiteUrl();
      } catch {
        siteUrl = null;
      }
      const safeRedirectTo = getSafeAuthRedirectUrl({
        requestedRedirectTo: redirectTo,
        siteUrl,
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
      const { url, anonKey } = getSupabasePublicEnv();
      const supabase = createClient(url, anonKey);
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
