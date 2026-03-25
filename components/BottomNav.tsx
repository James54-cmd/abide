"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Home, MessageCircle, BookOpen, Heart, ScrollText } from "lucide-react";
import { motion } from "framer-motion";
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
    <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-[430px] z-50 bg-gradient-to-t from-parchment/98 to-parchment/95 dark:from-dark-bg/98 dark:to-dark-bg/95 backdrop-blur-xl border-t border-gold/20 shadow-2xl shadow-gold/10">
      {isBiblePage ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-[430px] border-b border-gold/15 px-4 py-3 flex items-center justify-between gap-3"
        >
          <Button 
            onClick={handlePrev} 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-9 w-9 hover:bg-gold/10 transition-all duration-200 hover:scale-110 active:scale-95" 
            disabled={!bibleBottom.canPrev}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <p className="text-xs text-muted font-semibold truncate">{bibleBottom.chapterLabel}</p>
          <Button 
            onClick={handleNext} 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-9 w-9 hover:bg-gold/10 transition-all duration-200 hover:scale-110 active:scale-95" 
            disabled={!bibleBottom.canNext}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </motion.div>
      ) : null}
      {isChatPage ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-[430px] border-b border-gold/15 px-4 py-3"
        >
          <EncouragementInput
            onSend={handleChatSend}
            disabled={chatComposerDisabled}
            placeholder="Share what's on your heart…"
          />
        </motion.div>
      ) : null}
      <div className="mx-auto max-w-[430px] flex items-center justify-around h-20 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={false}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.92 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 relative group",
                  isActive
                    ? "text-gold"
                    : "text-muted hover:text-ink dark:hover:text-parchment"
                )}
              >
                {/* Background glow on active */}
                {isActive && (
                  <motion.div
                    layoutId="navbar-bg"
                    className="absolute inset-0 rounded-2xl bg-gold/8 -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                
                {/* Icon with rotation animation */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    rotate: isActive ? 360 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                  }}
                >
                  <Icon 
                    className="w-6 h-6" 
                    strokeWidth={isActive ? 2.5 : 1.5}
                    style={{
                      filter: isActive ? "drop-shadow(0 0 8px rgba(212, 175, 55, 0.3))" : "none"
                    }}
                  />
                </motion.div>

                {/* Label with conditional visibility */}
                <motion.span
                  animate={{
                    opacity: isActive ? 1 : 0.75,
                    fontSize: isActive ? "11px" : "10px",
                  }}
                  transition={{ duration: 0.2 }}
                  className="text-[10px] font-bold tracking-tight whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
}
