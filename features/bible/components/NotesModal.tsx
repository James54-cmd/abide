"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatVerseSelectionLabel } from "@/features/bible/helpers";
import type { SelectedRange } from "@/features/bible/helpers";
import type { BibleNote } from "@/features/bible/types";

type NotesModalProps = {
  open: boolean;
  onClose: () => void;
  isCreatingNote: boolean;
  notes: BibleNote[];
  noteDraft: string;
  onNoteDraftChange: (value: string) => void;
  onSaveNote: () => void;
  onCancelCreate: () => void;
  onDeleteNote: (id: string) => void;
  selectedRange: SelectedRange | null;
  selectedVerseCount: number;
};

export function NotesModal({
  open,
  onClose,
  isCreatingNote,
  notes,
  noteDraft,
  onNoteDraftChange,
  onSaveNote,
  onCancelCreate,
  onDeleteNote,
  selectedRange,
  selectedVerseCount,
}: NotesModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[400px] rounded-2xl bg-white dark:bg-dark-card border border-gold/10 shadow-lg max-h-[80dvh] flex flex-col"
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="font-serif text-lg font-semibold text-ink dark:text-parchment">
              {isCreatingNote ? "Add Note" : `Notes (${notes.length})`}
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gold/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isCreatingNote ? (
              <div className="space-y-3">
                <p className="text-xs text-gold font-medium">
                  {formatVerseSelectionLabel(selectedRange, selectedVerseCount)}
                </p>
                <textarea
                  value={noteDraft}
                  onChange={(e) => onNoteDraftChange(e.target.value)}
                  autoFocus
                  placeholder="Write your reflection..."
                  className="w-full min-h-28 rounded-xl border border-gold/10 bg-parchment/30 dark:bg-dark-bg/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={onSaveNote} disabled={!noteDraft.trim()} className="flex-1">
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={onCancelCreate} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : notes.length === 0 ? (
              <p className="text-sm text-muted text-center py-10">
                Select verse(s), then tap &quot;Note&quot; to start.
              </p>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-xl bg-parchment/40 dark:bg-dark-bg/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gold">
                          {note.verseStart === note.verseEnd
                            ? `Verse ${note.verseStart}`
                            : `Verses ${note.verseStart}-${note.verseEnd}`}
                        </p>
                        <p className="text-sm mt-1 whitespace-pre-wrap text-ink dark:text-parchment">{note.content}</p>
                        <p className="text-[10px] text-muted mt-1.5">{new Date(note.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="p-1 text-muted hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
