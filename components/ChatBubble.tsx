"use client";

import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, Verse } from "@/types";
import { useState } from "react";

interface ChatBubbleProps {
  message: ChatMessage;
  onBookmarkVerse?: (verse: Verse) => void;
}

function VerseQuote({
  verse,
  onBookmark,
}: {
  verse: Verse;
  onBookmark?: (verse: Verse) => void;
}) {
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <div className="relative rounded-xl bg-parchment/30 dark:bg-dark-bg/30 border border-gold/10 pl-4 pr-10 py-3 my-3">
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-gold" />
      <p className="font-serif text-base italic leading-relaxed text-ink dark:text-parchment">
        &ldquo;{verse.text}&rdquo;
      </p>
      <p className="mt-1.5 text-xs font-semibold text-gold tracking-wide">
        {verse.reference}
      </p>
      <button
        onClick={() => {
          setBookmarked(!bookmarked);
          onBookmark?.(verse);
        }}
        className={cn(
          "absolute top-3 right-3 p-1.5 rounded-lg transition-all active:scale-95",
          bookmarked
            ? "bg-gold/10"
            : "hover:bg-gold/10"
        )}
        aria-label="Bookmark verse"
      >
        <Bookmark
          className={cn(
            "w-4 h-4 transition-colors",
            bookmarked ? "fill-gold text-gold" : "text-muted"
          )}
          strokeWidth={1.5}
        />
      </button>
    </div>
  );
}

export default function ChatBubble({ message, onBookmarkVerse }: ChatBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end my-2">
        <div className="max-w-[85%] bg-gold/[0.08] dark:bg-gold/[0.15] rounded-xl rounded-br-sm px-4 py-3 border border-gold/10">
          <p className="text-sm font-serif leading-relaxed text-ink dark:text-parchment">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  const enc = message.encouragement;
  if (!enc) return null;

  return (
    <div className="flex justify-start my-2">
      <div className="max-w-[90%] bg-white dark:bg-dark-card rounded-xl rounded-bl-sm px-4 py-4 shadow-warm border border-gold/10 border-l-2 border-l-gold">
        <p className="text-sm font-serif leading-relaxed text-ink dark:text-parchment mb-3">
          {enc.intro}
        </p>
        {enc.verses.map((verse) => (
          <VerseQuote
            key={verse.reference}
            verse={verse}
            onBookmark={onBookmarkVerse}
          />
        ))}
        <p className="text-sm font-serif leading-relaxed text-ink dark:text-parchment mt-3">
          {enc.closing}
        </p>
      </div>
    </div>
  );
}
