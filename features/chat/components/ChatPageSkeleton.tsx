import { Skeleton } from "@/components/ui/skeleton";

export default function ChatPageSkeleton() {
  return (
    <div className="px-4 pt-4 pb-20 space-y-3" aria-busy aria-label="Loading chat">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-[85%] rounded-2xl rounded-br-md" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-24 w-[90%] rounded-2xl rounded-bl-md" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-8 w-[70%] rounded-2xl rounded-br-md" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-16 w-[88%] rounded-2xl rounded-bl-md" />
      </div>
    </div>
  );
}
