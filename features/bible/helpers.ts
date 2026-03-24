import { cn } from "@/lib/utils";

export type FontSize = "small" | "medium" | "large" | "xlarge";
export type FontFamily = "serif" | "sans";
export type LineSpacing = "tight" | "normal" | "relaxed" | "loose";
export type HighlightColor = "gold" | "mint" | "blue" | "pink" | "purple";

export type BibleVerse = { reference: string; text: string; verse: number };
export type BibleHighlight = {
  id: string;
  verseStart: number;
  verseEnd: number;
  color: string;
};

/** Min/max span of selected verse numbers; `contiguous` is false if gaps exist (e.g. 1 and 3 only). */
export type SelectedRange = {
  start: number;
  end: number;
  contiguous: boolean;
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

export const HIGHLIGHT_COLORS: { key: HighlightColor; chipClass: string; textClass: string }[] = [
  { key: "gold", chipClass: "bg-amber-300", textClass: "bg-amber-200/60 dark:bg-amber-400/25" },
  { key: "mint", chipClass: "bg-emerald-300", textClass: "bg-emerald-200/60 dark:bg-emerald-400/25" },
  { key: "blue", chipClass: "bg-sky-300", textClass: "bg-sky-200/60 dark:bg-sky-400/25" },
  { key: "pink", chipClass: "bg-rose-300", textClass: "bg-rose-200/60 dark:bg-rose-400/25" },
  { key: "purple", chipClass: "bg-violet-300", textClass: "bg-violet-200/60 dark:bg-violet-400/25" },
];

export function getSelectedRange(selectedVerses: number[]): SelectedRange | null {
  if (selectedVerses.length === 0) return null;
  const sorted = [...selectedVerses].sort((a, b) => a - b);
  const start = sorted[0];
  const end = sorted[sorted.length - 1];
  const contiguous = sorted.length === end - start + 1;
  return { start, end, contiguous };
}

export function formatVerseSelectionLabel(range: SelectedRange | null, selectedCount: number): string {
  if (!range || selectedCount === 0) return "No verses selected";
  if (selectedCount === 1 || range.start === range.end) return `Verse ${range.start}`;
  if (range.contiguous) return `Verses ${range.start}–${range.end}`;
  return `${selectedCount} verses selected`;
}

export function getVerseHighlightTextClass(verseNumber: number, highlights: BibleHighlight[]) {
  const match = highlights.find((h) => verseNumber >= h.verseStart && verseNumber <= h.verseEnd);
  if (!match) return "";
  const colorKey = (match.color?.toLowerCase() || "gold") as HighlightColor;
  return HIGHLIGHT_COLORS.find((c) => c.key === colorKey)?.textClass ?? HIGHLIGHT_COLORS[0].textClass;
}

export function buildVerseTextClasses(args: {
  fontSize: FontSize;
  fontFamily: FontFamily;
  lineSpacing: LineSpacing;
}) {
  return cn(
    "text-ink dark:text-parchment",
    FONT_SIZE_CLASSES[args.fontSize],
    FONT_FAMILY_CLASSES[args.fontFamily],
    LINE_SPACING_CLASSES[args.lineSpacing]
  );
}

/** Copies only the verses actually selected (handles non-contiguous picks). */
export function buildSelectedCopyText(verses: BibleVerse[], selectedVerses: number[]) {
  const set = new Set(selectedVerses);
  return verses
    .filter((v) => set.has(v.verse))
    .sort((a, b) => a.verse - b.verse)
    .map((v) => `${v.reference} ${v.text}`)
    .join("\n");
}
