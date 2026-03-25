"use client";

import PageTransition from "@/components/PageTransition";
import EmptyState from "@/components/ui/EmptyState";
import ChatBubble from "@/features/chat/components/ChatBubble";
import LoadingDots from "@/features/chat/components/LoadingDots";
import { useChatState } from "@/features/chat/hooks/useChatState";

export default function ChatPage() {
  const { messages, isLoading, isBootstrapping, handleBookmark } = useChatState();

  return (
    <PageTransition>
      <div className="px-4 pt-4 pb-20">
        <div className="space-y-2">
          {!isBootstrapping && messages.length === 0 && (
            <EmptyState
              className="py-20"
              title="Share what&apos;s on your heart"
              description="God&apos;s Word has something for every season of life."
            />
          )}
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              onBookmarkVerse={handleBookmark}
            />
          ))}
          {isLoading && <LoadingDots />}
        </div>
      </div>
    </PageTransition>
  );
}
