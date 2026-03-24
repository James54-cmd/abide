"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Trash2 } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import EmptyState from "@/components/ui/EmptyState";
import { mockFavorites } from "@/lib/mock-data";
import type { FavoriteVerse } from "@/types";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteVerse[]>(mockFavorites);

  const handleRemove = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <PageTransition>
      <div className="px-4 pt-4 pb-4">
        <h2 className="text-lg font-serif font-semibold text-ink dark:text-parchment mb-4">
          Saved Verses
        </h2>

        {favorites.length === 0 ? (
          <EmptyState
            className="pt-20"
            icon={
              <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                <BookOpen className="w-10 h-10 text-gold" strokeWidth={1.2} />
              </div>
            }
            title="Your saved verses will appear here"
            description="Tap the bookmark icon on any verse to save it for later."
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {favorites.map((fav) => (
                <motion.div
                  key={fav.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, x: -100 }}
                  transition={{ duration: 0.25 }}
                  className="relative bg-white dark:bg-dark-card rounded-2xl p-5 shadow-warm border border-gold/5"
                >
                  <p className="font-serif text-lg italic leading-relaxed text-ink dark:text-parchment pr-8">
                    &ldquo;{fav.text}&rdquo;
                  </p>
                  <p className="mt-3 text-sm font-semibold text-gold">
                    {fav.reference}
                  </p>
                  <button
                    onClick={() => handleRemove(fav.id)}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-red-400 transition-colors active:scale-95"
                    aria-label="Remove from favorites"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
