"use client";

import { motion } from "framer-motion";
import { MessageSquare, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BibleActionBarProps {
  selectedCount: number;
  activeColor?: string | null;
  onNote: () => void;
  onCopy: () => void;
  onHighlight: (color: string) => void;
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
  selectedCount,
  activeColor,
  onNote,
  onCopy,
  onHighlight,
  onClear,
}: BibleActionBarProps) {
  return (
    <div className="fixed bottom-32 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-[400px] pointer-events-auto"
      >
        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl border border-gold/20 rounded-2xl shadow-2xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 border-r border-gold/10 pr-3">
            <button
              onClick={onClear}
              className="p-1 rounded-full hover:bg-gold/10 text-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-gold tabular-nums">{selectedCount}</span>
          </div>

          <div className="flex items-center justify-center gap-3 flex-1">
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

          <div className="flex items-center gap-1 pl-3 border-l border-gold/10">
            <button
              onClick={onNote}
              className="p-2 rounded-xl hover:bg-gold/10 text-muted hover:text-gold transition-colors"
              title="Add Note"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={onCopy}
              className="p-2 rounded-xl hover:bg-gold/10 text-muted hover:text-gold transition-colors"
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
