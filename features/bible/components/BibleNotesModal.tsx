"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BibleNote } from "@/features/bible/types";

interface BibleNotesModalProps {
  notes: BibleNote[];
  activeVerseForNote: string | null;
  noteDraft: string;
  isEditing?: boolean;
  onNoteDraftChange: (value: string) => void;
  onSaveNote: () => void;
  onCancelNote: () => void;
  onEditNote: (note: BibleNote) => void;
  onDeleteNote: (noteId: string) => void;
  onClose: () => void;
}

export default function BibleNotesModal({
  notes,
  activeVerseForNote,
  noteDraft,
  isEditing,
  onNoteDraftChange,
  onSaveNote,
  onCancelNote,
  onEditNote,
  onDeleteNote,
  onClose,
}: BibleNotesModalProps) {
  // Parse verse number from reference string (e.g. "GEN 1:1" -> 1)
  const activeVerseNum = activeVerseForNote ? parseInt(activeVerseForNote.split(':').pop() || "") : null;
  
  const filteredNotes = activeVerseForNote && !isNaN(activeVerseNum as number)
    ? notes.filter(n => n.verse_start === activeVerseNum)
    : notes;

  const sortedNotes = [...filteredNotes].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-[400px] rounded-2xl bg-white dark:bg-dark-card border border-gold/10 shadow-lg max-h-[80dvh] flex flex-col z-10"
        onClick={(e) => e.stopPropagation()}
      >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="font-serif text-lg font-semibold text-ink dark:text-parchment">
              {isEditing ? "Edit Note" : activeVerseForNote ? "Add Note" : `Notes (${notes.length})`}
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gold/10 text-muted">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {activeVerseForNote ? (
              <div className="space-y-3">
                <p className="text-xs text-gold font-medium">{activeVerseForNote}</p>
                <textarea
                  value={noteDraft}
                  onChange={(e) => onNoteDraftChange(e.target.value)}
                  autoFocus
                  placeholder="Write your reflection..."
                  className="w-full min-h-28 rounded-xl border border-gold/10 bg-parchment/30 dark:bg-dark-bg/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none text-ink dark:text-parchment placeholder:text-muted/60"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={onSaveNote} disabled={!noteDraft.trim()} className="flex-1 bg-gold hover:bg-gold/90 text-white border-0 font-bold">Save Note</Button>
                  <Button size="sm" variant="outline" onClick={onCancelNote} className="flex-1 border-gold/20 text-muted font-medium">Cancel</Button>
                </div>

                {sortedNotes.length > 0 && (
                  <div className="pt-4 border-t border-gold/10">
                    <p className="text-[10px] font-bold text-muted/60 uppercase tracking-widest mb-3">Recent for this Verse</p>
                    <div className="space-y-2">
                      {sortedNotes.map((note) => (
                        <div key={note.id} className="rounded-xl bg-gold/5 dark:bg-gold/5 p-3 border border-gold/10 group">
                           <p className="text-sm text-ink dark:text-parchment leading-relaxed">{note.content}</p>
                           <div className="mt-2 flex items-center justify-between">
                             <p className="text-[10px] text-muted font-medium">
                               {new Date(note.created_at).toLocaleDateString(undefined, { 
                                 month: 'short', 
                                 day: 'numeric',
                                 hour: '2-digit',
                                 minute: '2-digit'
                               })}
                               {note.updated_at && note.updated_at !== note.created_at && (
                                 <span className="ml-1 opacity-60">
                                   (Edited: {new Date(note.updated_at).toLocaleDateString(undefined, { 
                                     hour: '2-digit', 
                                     minute: '2-digit' 
                                   })})
                                 </span>
                               )}
                             </p>
                             <div className="flex gap-1">
                               <button 
                                 onClick={() => onEditNote(note)}
                                 className="text-[10px] font-bold text-gold hover:underline px-2 py-1"
                               >
                                 Edit
                               </button>
                               <button 
                                 onClick={() => onDeleteNote(note.id)}
                                 className="text-[10px] font-bold text-red-500/60 hover:text-red-500 px-2 py-1"
                               >
                                 Delete
                               </button>
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : notes.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-3">
                   <X className="w-6 h-6 text-gold rotate-45" />
                </div>
                <p className="text-sm text-balance">
                  Tap a verse, then &quot;Note&quot; to start.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedNotes.map((note) => (
                  <div key={note.id} className="rounded-xl bg-parchment/40 dark:bg-dark-bg/40 p-3 border border-gold/5 group relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gold/60 uppercase tracking-widest">{note.translation}</p>
                        <p className="text-sm mt-1 whitespace-pre-wrap text-ink dark:text-parchment leading-relaxed">{note.content}</p>
                        <p className="text-[10px] text-muted mt-2 font-medium">
                          {new Date(note.created_at).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {note.updated_at && note.updated_at !== note.created_at && (
                            <span className="ml-1 opacity-60">
                              (Edited: {new Date(note.updated_at).toLocaleDateString(undefined, { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })})
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditNote(note)}
                          className="p-1.5 rounded-lg hover:bg-gold/10 text-gold transition-all active:scale-90"
                          title="Edit"
                        >
                           <span className="text-[10px] font-bold px-1">Edit</span>
                        </button>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="p-1 px-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-muted/40 transition-all active:scale-90"
                          title="Delete"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
    </motion.div>
  );
}
