import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPageSkeleton() {
  return (
    <div className="px-4 pt-6 pb-8 max-w-xl mx-auto" aria-busy aria-label="Loading settings">
      <div className="rounded-3xl border border-gold/10 bg-white dark:bg-dark-card p-6 shadow-warm text-center space-y-6">
        <Skeleton className="h-6 w-24 mx-auto rounded-lg" />
        <div className="flex justify-center">
          <Skeleton className="h-28 w-28 rounded-full" />
        </div>
        <Skeleton className="h-9 w-32 mx-auto rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 mx-auto rounded-lg" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>
        <Skeleton className="h-10 w-full rounded-full max-w-[280px] mx-auto" />
        <div className="border-t border-gold/10 pt-4 space-y-3 text-left">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}
