import type { BibleVerse, BibleHighlight } from "./types";

/**
 * Determines the uniform highlight color of a set of selected verses, if they all share the same color.
 * Returns null if no color is shared or if they have different colors.
 */
export function getActiveHighlightColor(
  selectedVerseIds: string[],
  verses: BibleVerse[],
  highlights: BibleHighlight[]
): string | null {
  if (selectedVerseIds.length === 0) return null;
  const nums = selectedVerseIds
    .map(ref => verses.find(v => v.reference === ref)?.verse)
    .filter((v): v is number => v !== undefined);

  let firstColor: string | null = null;
  for (const num of nums) {
    const h = highlights.find(h => h.verse_start === num);
    if (!h) return null;
    if (!firstColor) firstColor = h.color;
    else if (firstColor !== h.color) return null;
  }
  return firstColor;
}

/**
 * Formats a list of verse references into a human-readable citation string.
 * Example: "Job 1:6-8, 10 NIV"
 */
export function getFormattedSelectionCitation(
  selectedVerseIds: string[],
  verses: BibleVerse[],
  bookName: string,
  chapterNumber: string | number,
  translation: string
): string {
  if (selectedVerseIds.length === 0) return "";
  
  const nums = selectedVerseIds
    .map(ref => verses.find(v => v.reference === ref)?.verse)
    .filter((v): v is number => v !== undefined);
  
  if (nums.length === 0) return "";
  
  nums.sort((a, b) => a - b);
  const result: string[] = [];
  let start = nums[0];
  let end = nums[0];

  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === end + 1) {
      end = nums[i];
    } else {
      result.push(start === end ? `${start}` : `${start}-${end}`);
      start = nums[i];
      end = nums[i];
    }
  }
  result.push(start === end ? `${start}` : `${start}-${end}`);
  
  const chapterLabel = `${bookName} ${chapterNumber}`;
  return `${chapterLabel}:${result.join(", ")} ${translation}`;
}
