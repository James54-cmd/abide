"use client";

import { useState, useMemo } from "react";
import { topicVerses, searchableVerses } from "@/lib/mock-data";
import type { Verse } from "@/types";

const topics = Object.keys(topicVerses);

export function useVersesState() {
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

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveTopic(null);
  };

  return {
    query,
    activeTopic,
    results,
    topics,
    handleTopicClick,
    handleQueryChange,
  };
}

export type VersesState = ReturnType<typeof useVersesState>;
