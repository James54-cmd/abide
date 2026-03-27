"use client";

import { useEffect, useRef, useState } from "react";
import PageTransition from "@/components/PageTransition";
import EmptyState from "@/components/ui/EmptyState";
import ChatBubble from "@/features/chat/components/ChatBubble";
import ChatPageSkeleton from "@/features/chat/components/ChatPageSkeleton";
import LoadingDots from "@/features/chat/components/LoadingDots";
import { useChatState } from "@/features/chat/hooks/useChatState";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { messages, isLoading, isBootstrapping, handleBookmark } = useChatState();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isBootstrapping && messages.length > 0) {
      const isInitialLoad = messages.length > 0 && !bottomRef.current?.dataset.initialized;
      
      bottomRef.current?.scrollIntoView({ 
        behavior: isInitialLoad ? "auto" : "smooth" 
      });

      if (bottomRef.current) {
        bottomRef.current.dataset.initialized = "true";
      }
    }
  }, [messages, isLoading, isBootstrapping]);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = main;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      // Show button if we're more than 300px from the bottom
      setShowScrollButton(distanceFromBottom > 300);
    };

    main.addEventListener("scroll", handleScroll);
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <PageTransition>
      <div className="relative px-4 pt-4 pb-20 min-h-full">
        <div className="space-y-2">
          {isBootstrapping ? (
            <ChatPageSkeleton />
          ) : null}
          {!isBootstrapping && messages.length === 0 && (
            <EmptyState
              className="py-20"
              title="Share what&apos;s on your heart"
              description="God&apos;s Word has something for every season of life."
            />
          )}
          {!isBootstrapping &&
            messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                onBookmarkVerse={handleBookmark}
              />
            ))}
          {isLoading && <LoadingDots />}
          <div ref={bottomRef} className="h-px w-full" />
        </div>

        {/* Floating Scroll to Bottom Button */}
        <button
          onClick={scrollToBottom}
          className={cn(
            "fixed bottom-32 right-6 p-3 rounded-full bg-gold text-white shadow-lg transition-all duration-300 transform active:scale-90 z-40",
            showScrollButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
          )}
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>
    </PageTransition>
  );
}
