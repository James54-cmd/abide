"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Verse } from "@/types";

interface VerseCardProps {
  verse: Verse;
  initialBookmarked?: boolean;
  onBookmark?: (verse: Verse) => void;
  className?: string;
}

export default function VerseCard({
  verse,
  initialBookmarked = false,
  onBookmark,
  className,
}: VerseCardProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    onBookmark?.(verse);
  };

  return (
    <div
      className={cn(
        "relative bg-white dark:bg-dark-card rounded-2xl p-5 shadow-warm border border-gold/5",
        className
      )}
    >
      <p className="font-serif text-lg italic leading-relaxed text-ink dark:text-parchment pr-8">
        &ldquo;{verse.text}&rdquo;
      </p>
      <p className="mt-3 text-sm font-semibold text-gold">
        {verse.reference}
      </p>
      <button
        onClick={handleBookmark}
        className="absolute top-4 right-4 p-1.5 rounded-full transition-all active:scale-95 hover:bg-gold/10"
        aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      >
        <Bookmark
          className={cn(
            "w-5 h-5 transition-colors",
            bookmarked
              ? "fill-gold text-gold"
              : "text-muted"
          )}
          strokeWidth={1.5}
        />
      </button>
    </div>
  );
}
