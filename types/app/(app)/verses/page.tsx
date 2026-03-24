"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import EmptyState from "@/components/ui/EmptyState";
import VerseCard from "@/components/VerseCard";
import { topicVerses, searchableVerses } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { Verse } from "@/types";

const topics = Object.keys(topicVerses);

export default function VersesPage() {
  const [query, setQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const results: Verse[] = useMemo(() => {
    if (activeTopic) {
      return topicVerses[activeTopic] ?? [];
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      return searchableVerses.filter(
        (v) =>
          v.text.toLowerCase().includes(q) ||
          v.reference.toLowerCase().includes(q)
      );
    }
    return [];
  }, [query, activeTopic]);

  const handleTopicClick = (topic: string) => {
    setActiveTopic((prev) => (prev === topic ? null : topic));
    setQuery("");
  };

  return (
    <PageTransition>
      <div className="px-4 pt-4 pb-4 space-y-4">
        {/* Search bar */}
        <div className="flex items-center gap-3 bg-white dark:bg-dark-card rounded-2xl px-4 py-3 shadow-warm border border-gold/10">
          <Search className="w-4 h-4 text-muted flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveTopic(null);
            }}
            placeholder="Search by keyword, topic, or reference"
            className="flex-1 bg-transparent text-sm text-ink dark:text-parchment placeholder:text-muted focus:outline-none"
          />
        </div>

        {/* Topic chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => handleTopicClick(topic)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95",
                activeTopic === topic
                  ? "bg-gold text-white shadow-sm"
                  : "bg-white dark:bg-dark-card text-muted border border-gold/10 shadow-warm"
              )}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="space-y-3">
            {results.map((verse) => (
              <VerseCard key={verse.reference} verse={verse} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="pt-16"
            title="Explore God&apos;s Word"
            description="Search for a keyword or tap a topic above to discover encouraging verses."
          />
        )}
      </div>
    </PageTransition>
  );
}
