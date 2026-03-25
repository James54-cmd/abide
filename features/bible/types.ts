export type Translation = "NIV" | "NLT";
export type FontSize = "small" | "medium" | "large" | "xlarge";
export type FontFamily = "serif" | "sans";
export type LineSpacing = "tight" | "normal" | "relaxed" | "loose";

export type BibleBook = { id: string; name: string };
export type BibleChapter = { id: string; number: number };
export type BibleVerse = { reference: string; text: string; verse: number };
export type Note = {
  id: string;
  verseReference: string;
  content: string;
  timestamp: string;
};
export type BibleProgress = {
  translation: Translation;
  bookId: string;
  chapterId: string;
  verse: number;
};

export const FONT_SIZE_CLASSES: Record<FontSize, string> = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
  xlarge: "text-xl",
};
export const FONT_FAMILY_CLASSES: Record<FontFamily, string> = {
  serif: "font-serif",
  sans: "font-sans",
};
export const LINE_SPACING_CLASSES: Record<LineSpacing, string> = {
  tight: "leading-snug",
  normal: "leading-relaxed",
  relaxed: "leading-loose",
  loose: "leading-[2.2]",
};
export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  small: "S",
  medium: "M",
  large: "L",
  xlarge: "XL",
};
