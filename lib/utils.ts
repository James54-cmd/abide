import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string, fallback = "U") {
  const trimmed = name.trim();
  if (!trimmed) return fallback;

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase() || fallback;
}

export function getAvatar(avatarUrl: string | null | undefined) {
  const trimmed = avatarUrl?.trim();
  return trimmed ? trimmed : null;
}
