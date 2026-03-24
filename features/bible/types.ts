import type { BibleVerse } from "@/features/bible/helpers";

export type Translation = "NIV" | "NLT";

export type BibleBook = { id: string; name: string };
export type BibleChapter = { id: string; number: number };

export type BibleProgress = {
  translation: Translation;
  bookId: string;
  chapterId: string;
  verse: number;
};

export type BibleNote = {
  id: string;
  verseStart: number;
  verseEnd: number;
  content: string;
  createdAt: string;
};

export type BibleBootstrap = {
  translation: Translation;
  books: BibleBook[];
  selectedBookId: string;
  chapters: BibleChapter[];
  selectedChapterId: string;
  verses: BibleVerse[];
  progress?: BibleProgress | null;
};
