"use client";

import { useEffect, useState } from "react";
import type {
  FontSize,
  FontFamily,
  LineSpacing,
  BibleProgress,
} from "@/features/bible/types";
import {
  FONT_SIZE_CLASSES,
  FONT_FAMILY_CLASSES,
  LINE_SPACING_CLASSES,
} from "@/features/bible/types";
import { cn } from "@/lib/utils";

const PREFS_KEY = "abide_bible_prefs";

export function useBiblePreferences(serverProgress: BibleProgress | null) {
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [fontFamily, setFontFamily] = useState<FontFamily>("serif");
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>("normal");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const prefs = JSON.parse(raw) as Record<string, string>;
      if (prefs.fontSize && ["small", "medium", "large", "xlarge"].includes(prefs.fontSize))
        setFontSize(prefs.fontSize as FontSize);
      if (prefs.fontFamily && ["serif", "sans"].includes(prefs.fontFamily))
        setFontFamily(prefs.fontFamily as FontFamily);
      if (prefs.lineSpacing && ["tight", "normal", "relaxed", "loose"].includes(prefs.lineSpacing))
        setLineSpacing(prefs.lineSpacing as LineSpacing);
    } catch {}
  }, []);

  useEffect(() => {
    if (!serverProgress) return;
    if (serverProgress.fontSize) setFontSize(serverProgress.fontSize);
    if (serverProgress.fontFamily) setFontFamily(serverProgress.fontFamily);
    if (serverProgress.lineSpacing) setLineSpacing(serverProgress.lineSpacing);
  }, [serverProgress]);

  useEffect(() => {
    window.localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ fontSize, fontFamily, lineSpacing })
    );
  }, [fontSize, fontFamily, lineSpacing]);

  const verseTextClasses = cn(
    "text-ink dark:text-parchment",
    FONT_SIZE_CLASSES[fontSize],
    FONT_FAMILY_CLASSES[fontFamily],
    LINE_SPACING_CLASSES[lineSpacing]
  );

  return {
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    lineSpacing,
    setLineSpacing,
    verseTextClasses,
  };
}
