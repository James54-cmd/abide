"use client";

import { Sparkles } from "lucide-react";
import type { Verse } from "@/types";

interface VerseOfTheDayProps {
  verse: Verse;
}

export default function VerseOfTheDay({ verse }: VerseOfTheDayProps) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-dark-card rounded-2xl p-6 shadow-warm border border-gold/10">
      <div className="absolute top-3 right-3 opacity-20">
        <Sparkles className="w-8 h-8 text-gold" />
      </div>
      <p className="text-xs uppercase tracking-widest text-gold font-medium mb-3">
        Verse of the Day
      </p>
      <p className="font-serif text-xl italic leading-relaxed text-ink dark:text-parchment">
        &ldquo;{verse.text}&rdquo;
      </p>
      <p className="mt-4 text-sm font-semibold text-gold">
        — {verse.reference}
      </p>
    </div>
  );
}
