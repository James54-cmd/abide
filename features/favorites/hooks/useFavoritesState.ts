"use client";

import { useState, useEffect } from "react";
import { fetchBibleFavorites, deleteBibleFavorite } from "@/lib/graphql/bible/hooks";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { BibleFavorite } from "@/features/bible/types";
import { toast } from "sonner";

export function useFavoritesState() {
  const [favorites, setFavorites] = useState<BibleFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const data = await fetchBibleFavorites(session.access_token);
        setFavorites(data);
      } catch (error) {
        console.error("Failed to load favorites", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleRemove = async (id: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Optimistic update
      setFavorites(prev => prev.filter(f => f.id !== id));
      
      await deleteBibleFavorite(session.access_token, id);
      toast.success("Removed from favorites");
    } catch (error) {
      toast.error("Failed to remove favorite");
      // Revert on error? Or just refresh
    }
  };

  const requestRemove = (id: string) => {
    setPendingFavoriteId(id);
    setIsConfirmOpen(true);
  };

  const cancelRemove = () => {
    setIsConfirmOpen(false);
    setPendingFavoriteId(null);
  };

  const confirmRemove = async () => {
    if (!pendingFavoriteId) return;

    try {
      setIsConfirming(true);
      await handleRemove(pendingFavoriteId);
    } finally {
      setIsConfirming(false);
      cancelRemove();
    }
  };

  return {
    favorites,
    handleRemove,
    isLoading,

    // Confirm modal state + actions
    isConfirmOpen,
    isConfirming,
    requestRemove,
    cancelRemove,
    confirmRemove,
  };
}

export type FavoritesState = ReturnType<typeof useFavoritesState>;
