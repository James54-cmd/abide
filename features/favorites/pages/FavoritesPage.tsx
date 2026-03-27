"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import Link from "next/link";
import PageTransition from "@/components/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useFavoritesState } from "@/features/favorites/hooks/useFavoritesState";
import ConfirmActionModal from "@/components/ui/ConfirmActionModal";

export default function FavoritesPage() {
  const {
    favorites,
    isLoading,
    isConfirmOpen,
    isConfirming,
    requestRemove,
    cancelRemove,
    confirmRemove,
  } = useFavoritesState();

  const formatFavoriteReference = (fav: (typeof favorites)[number]) => {
    if (!fav.book_name) return fav.verse_reference;
    const bookName = fav.book_name;

    const chapterRaw = String(fav.chapter_id ?? "");
    const chapterPart = chapterRaw.includes(".") ? chapterRaw.split(".").pop() : chapterRaw;
    const chapterNumber = chapterPart ? Number(chapterPart) : NaN;
    if (!Number.isFinite(chapterNumber)) return fav.verse_reference;

    const versePart =
      fav.verse_end && fav.verse_end !== fav.verse_start ? `${fav.verse_start}-${fav.verse_end}` : String(fav.verse_start);

    return `${bookName} ${chapterNumber}:${versePart}`;
  };

  return (
    <PageTransition>
      <div className="px-4 pt-4 pb-4">
        <h2 className="text-lg font-serif font-semibold text-ink dark:text-parchment mb-4">
          Saved Verses
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <EmptyState
            className="pt-20"
            icon={
              <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mb-4 text-gold">
                <Heart className="w-10 h-10 fill-current" strokeWidth={1.2} />
              </div>
            }
            title="Your saved verses will appear here"
            description="Tap the heart icon on any verse selection to save it to your favorites."
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
                  className="relative group bg-white dark:bg-dark-card rounded-2xl p-5 shadow-warm border border-gold/5 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-gold/20 group-hover:bg-gold transition-colors" />
                  
                  <Link
                    href={`/bible?book=${fav.book_id}&chapter=${fav.chapter_id}&verse=${fav.verse_start}`}
                    className="block"
                  >
                    <p className="font-serif text-lg italic leading-relaxed text-ink dark:text-parchment pr-8">
                      &ldquo;{fav.verse_text}&rdquo;
                    </p>
                    <p className="mt-3 text-sm font-semibold text-gold uppercase tracking-wider">
                      {formatFavoriteReference(fav)} ({fav.translation})
                    </p>
                  </Link>

                  <button
                    onClick={() => {
                      requestRemove(fav.id);
                    }}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-muted/40 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95"
                    aria-label="Remove from favorites"
                  >
                    <Trash2
                      className="w-4 h-4"
                      strokeWidth={1.6}
                    />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ConfirmActionModal
        isOpen={isConfirmOpen}
        title="Remove Saved Verse?"
        description="This will remove the verse from your saved favorites."
        confirmText="Remove"
        cancelText="Cancel"
        danger
        isConfirming={isConfirming}
        onCancel={cancelRemove}
        onConfirm={confirmRemove}
      />
    </PageTransition>
  );
}
