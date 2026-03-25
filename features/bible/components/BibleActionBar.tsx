"use client";

import { motion } from "framer-motion";
import { MessageSquare, Copy, X, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface BibleActionBarProps {
  selectionLabel: string;
  activeColor?: string | null;
  isFavorited?: boolean;
  onNote: () => void;
  onCopy: () => void;
  onHighlight: (color: string) => void;
  onFavorite: () => void;
  onClear: () => void;
}

const COLORS = [
  { name: "gold", class: "bg-amber-400", ring: "ring-amber-400" },
  { name: "green", class: "bg-emerald-400", ring: "ring-emerald-400" },
  { name: "blue", class: "bg-sky-400", ring: "ring-sky-400" },
  { name: "rose", class: "bg-rose-400", ring: "ring-rose-400" },
  { name: "purple", class: "bg-purple-400", ring: "ring-purple-400" },
];

export default function BibleActionBar({
  selectionLabel,
  activeColor,
  isFavorited,
  onNote,
  onCopy,
  onHighlight,
  onFavorite,
  onClear,
}: BibleActionBarProps) {
  return (
    <div className="fixed bottom-32 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-[400px] pointer-events-auto flex flex-col items-center gap-3"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-ink/90 dark:bg-parchment/90 backdrop-blur-md text-parchment dark:text-ink px-4 py-1.5 rounded-full text-xs font-medium shadow-md max-w-[90%] truncate tracking-wide"
        >
          {selectionLabel}
        </motion.div>

        <div className="w-full bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl border border-gold/20 rounded-2xl shadow-2xl px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={onClear}
            className="p-1.5 -ml-1 rounded-full hover:bg-gold/10 text-muted transition-colors"
          >
            <X className="w-[18px] h-[18px]" />
          </button>

          <div className="flex items-center justify-center gap-3 px-2">
            {COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => onHighlight(color.name)}
                className={cn(
                  "w-[22px] h-[22px] rounded-full transition-all active:scale-75 shadow-sm",
                  color.class,
                  activeColor === color.name
                    ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-dark-card scale-110 shadow-md ${color.ring}`
                    : "hover:scale-110 hover:shadow-md"
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onFavorite}
              className={cn(
                "p-1.5 rounded-xl transition-all active:scale-75",
                isFavorited ? "text-red-500" : "text-muted hover:text-red-500"
              )}
              title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
            >
              <motion.div
                animate={isFavorited ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
              </motion.div>
            </button>
            <button
              onClick={onNote}
              className="p-1.5 rounded-xl hover:bg-gold/10 text-muted hover:text-gold transition-colors"
              title="Add Note"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={onCopy}
              className="p-1.5 -mr-1 rounded-xl hover:bg-gold/10 text-muted hover:text-gold transition-colors"
              title="Copy Selection"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
