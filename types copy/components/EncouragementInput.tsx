"use client";

import { useState, useRef } from "react";
import { SendHorizonal } from "lucide-react";
import { cn } from "@/lib/utils";

interface EncouragementInputProps {
  placeholder?: string;
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function EncouragementInput({
  placeholder = "What's on your heart today?",
  onSend,
  disabled = false,
}: EncouragementInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 bg-white dark:bg-dark-card rounded-2xl px-4 py-3 shadow-warm border border-gold/10">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none bg-transparent text-sm leading-relaxed text-ink dark:text-parchment",
          "placeholder:text-muted focus:outline-none max-h-24",
          "scrollbar-hide"
        )}
        style={{ fieldSizing: "content" } as React.CSSProperties}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className={cn(
          "flex-shrink-0 p-2.5 rounded-full transition-all active:scale-95",
          value.trim()
            ? "bg-gold text-white shadow-sm"
            : "bg-gold/20 text-muted"
        )}
        aria-label="Send message"
      >
        <SendHorizonal className="w-4 h-4" />
      </button>
    </div>
  );
}
