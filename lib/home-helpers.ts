import type { Verse } from "@/types";
import { searchableVerses } from "@/lib/mock-data";

type UserMetadata = {
  first_name?: unknown;
  full_name?: unknown;
};

export function getGreeting(firstName?: string | null): string {
  const hour = new Date().getHours();
  const name = firstName?.trim() || "beloved";

  if (hour < 12) return `Good morning, ${name} ☀️`;
  if (hour < 17) return `Good afternoon, ${name} 🌤️`;
  return `Good evening, ${name} 🌙`;
}

export function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function extractFirstName(metadata?: UserMetadata): string | null {
  const rawFirstName =
    typeof metadata?.first_name === "string"
      ? metadata.first_name
      : typeof metadata?.full_name === "string"
        ? metadata.full_name.split(" ")[0]
        : "";

  const normalized = rawFirstName.trim();
  return normalized || null;
}

// Deterministic "verse of today" so it changes daily but stays stable all day.
export function getDailyVerse(date = new Date()): Verse {
  if (searchableVerses.length === 0) {
    return {
      reference: "Psalm 46:1",
      text: "God is our refuge and strength, an ever-present help in trouble.",
    };
  }

  const dayKey = Math.floor(date.getTime() / 86_400_000);
  const index = Math.abs(dayKey) % searchableVerses.length;
  return searchableVerses[index];
}
