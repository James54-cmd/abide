"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import VerseOfTheDay from "@/features/home/components/VerseOfTheDay";
import EncouragementInput from "@/components/EncouragementInput";
import { verseOfTheDay, mockConversations } from "@/lib/mock-data";
import { useHomeState } from "@/features/home/hooks/useHomeState";

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function HomePage() {
  const router = useRouter();
  const { greeting } = useHomeState();

  const handleSend = (message: string) => {
    router.push(`/chat?q=${encodeURIComponent(message)}`);
  };

  return (
    <PageTransition>
      <div className="px-4 pt-6 pb-4 space-y-6">
        {/* Soft glow backdrop */}
        <div className="pointer-events-none fixed inset-0 max-w-[430px] mx-auto overflow-hidden">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-0 w-48 h-48 bg-gold/3 rounded-full blur-2xl" />
        </div>

        {/* Greeting */}
        <div className="relative">
          <h2 className="text-2xl font-serif font-semibold text-ink dark:text-parchment">
            {greeting}
          </h2>
          <p className="text-sm text-muted mt-1">
            Let God&apos;s Word speak into your day.
          </p>
        </div>

        {/* Verse of the Day */}
        <VerseOfTheDay verse={verseOfTheDay} />

        {/* Prompt input */}
        <EncouragementInput onSend={handleSend} />

        {/* Recent encouragements */}
        <div className="relative">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            Recent Encouragements
          </h3>
          <div className="space-y-2">
            {mockConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => router.push("/chat")}
                className="w-full flex items-center justify-between bg-white dark:bg-dark-card rounded-2xl px-4 py-3.5 shadow-warm border border-gold/5 transition-all active:scale-[0.98]"
              >
                <div className="text-left min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink dark:text-parchment truncate">
                    {conv.preview}
                  </p>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {conv.lastMessage}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                  <span className="text-[10px] text-muted">
                    {timeAgo(conv.timestamp)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
