"use client";

import { useState } from "react";
import { mockFavorites } from "@/lib/mock-data";
import type { FavoriteVerse } from "@/types";

export function useFavoritesState() {
  const [favorites, setFavorites] = useState<FavoriteVerse[]>(mockFavorites);

  const handleRemove = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  return { favorites, handleRemove };
}

export type FavoritesState = ReturnType<typeof useFavoritesState>;
