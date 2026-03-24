"use client";

import { cn } from "@/lib/utils";

export default function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-start mb-4", className)}>
      <div className="bg-white dark:bg-dark-card rounded-2xl rounded-bl-md px-5 py-4 shadow-warm border-l-2 border-gold">
        <p className="text-xs text-muted mb-2 italic">The Spirit is speaking…</p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-gold animate-pulse-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
