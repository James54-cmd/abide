"use client";

import Image from "next/image";
import { useMemo } from "react";
import { LOADER_VERSES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type PageLoaderProps = {
  className?: string;
  /** Full view vs shorter block inside a section (e.g. list loading). */
  size?: "page" | "compact";
};

function pickRandomVerse() {
  const i = Math.floor(Math.random() * LOADER_VERSES.length);
  return LOADER_VERSES[i]!;
}

export default function PageLoader({ className, size = "page" }: PageLoaderProps) {
  const verse = useMemo(() => pickRandomVerse(), []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center",
        size === "page" ? "min-h-[50vh] w-full py-12" : "min-h-[12rem] w-full py-10",
        className
      )}
    >
      <div
        className={cn(
          "motion-safe:animate-abide-symbol-breathe motion-reduce:opacity-100"
        )}
      >
        <Image
          src="/assets/abide-symbol.png"
          alt=""
          width={249}
          height={267}
          unoptimized
          className="h-[68px] w-[68px] object-contain object-center"
        />
      </div>

      <figure
        className={cn(
          "mt-6 px-3 text-center",
          size === "page" ? "max-w-[min(22rem,90vw)]" : "max-w-[min(19rem,88vw)]"
        )}
      >
        <blockquote
          className={cn(
            "m-0 border-0 p-0 font-serif not-italic leading-relaxed text-ink/90 dark:text-parchment/90",
            size === "page" ? "text-sm sm:text-[15px]" : "text-xs sm:text-sm",
            size === "page" ? "line-clamp-5" : "line-clamp-3"
          )}
        >
          <span className="text-gold/80">&ldquo;</span>
          {verse.text}
          <span className="text-gold/80">&rdquo;</span>
        </blockquote>
        <figcaption className="mt-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          {verse.reference}
        </figcaption>
      </figure>

      <span className="sr-only">Loading</span>
    </div>
  );
}
