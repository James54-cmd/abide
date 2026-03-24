"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Home, MessageCircle, BookOpen, Heart, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import EncouragementInput from "@/components/EncouragementInput";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/bible", label: "Bible", icon: ScrollText },
  { href: "/verses", label: "Verses", icon: BookOpen },
  { href: "/favorites", label: "Favorites", icon: Heart },
];

export default function BottomNav() {
  const pathname = usePathname();
  const isBiblePage = pathname === "/bible";
  const isChatPage = pathname === "/chat";
  const [bibleBottom, setBibleBottom] = useState({
    chapterLabel: "Bible",
    canPrev: false,
    canNext: false,
  });
  const [chatComposerDisabled, setChatComposerDisabled] = useState(false);

  useEffect(() => {
    const handleBibleBottom = (
      event: Event
    ) => {
      const customEvent = event as CustomEvent<{
        chapterLabel: string;
        canPrev: boolean;
        canNext: boolean;
      }>;
      if (!customEvent.detail) return;
      setBibleBottom({
        chapterLabel: customEvent.detail.chapterLabel || "Bible",
        canPrev: !!customEvent.detail.canPrev,
        canNext: !!customEvent.detail.canNext,
      });
    };
    window.addEventListener("abide:bible-bottom-nav", handleBibleBottom);
    return () => window.removeEventListener("abide:bible-bottom-nav", handleBibleBottom);
  }, []);

  useEffect(() => {
    const handleChatComposer = (event: Event) => {
      const customEvent = event as CustomEvent<{ disabled?: boolean }>;
      setChatComposerDisabled(!!customEvent.detail?.disabled);
    };
    window.addEventListener("abide:chat-composer-state", handleChatComposer);
    return () => window.removeEventListener("abide:chat-composer-state", handleChatComposer);
  }, []);

  const handlePrev = () => window.dispatchEvent(new Event("abide:bible-prev-chapter"));
  const handleNext = () => window.dispatchEvent(new Event("abide:bible-next-chapter"));
  const handleChatSend = (message: string) => {
    window.dispatchEvent(new CustomEvent("abide:chat-send", { detail: { message } }));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-parchment/95 dark:bg-dark-bg/95 backdrop-blur-md border-t border-gold/10">
      {isBiblePage ? (
        <div className="mx-auto max-w-[430px] border-b border-gold/10 px-4 py-2.5 flex items-center justify-between gap-3">
          <Button onClick={handlePrev} variant="ghost" size="icon" className="rounded-full h-9 w-9" disabled={!bibleBottom.canPrev}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <p className="text-xs text-muted font-medium truncate">{bibleBottom.chapterLabel}</p>
          <Button onClick={handleNext} variant="ghost" size="icon" className="rounded-full h-9 w-9" disabled={!bibleBottom.canNext}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      ) : null}
      {isChatPage ? (
        <div className="mx-auto max-w-[430px] border-b border-gold/10 px-4 py-2.5">
          <EncouragementInput
            onSend={handleChatSend}
            disabled={chatComposerDisabled}
            placeholder="Share what's on your heart…"
          />
        </div>
      ) : null}
      <div className="mx-auto max-w-[430px] flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all active:scale-95",
                isActive
                  ? "text-gold"
                  : "text-muted hover:text-ink dark:hover:text-parchment"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
