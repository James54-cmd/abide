import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-gold/20 border border-gold/15 dark:bg-white/15 dark:border-white/10",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
