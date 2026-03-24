import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-8",
        className
      )}
    >
      {icon ? icon : null}
      <p className="font-serif text-xl text-ink dark:text-parchment mb-2">{title}</p>
      <p className="text-sm text-muted">{description}</p>
    </div>
  );
}
