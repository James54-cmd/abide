"use client";

import { useEffect, useState } from "react";
import { Cross, Menu, MoreVertical, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";


type BibleHeaderState = {
  chapterLabel: string;
  translation: string;
};

type ChatTopbarState = {
  conversations: { id: string; title: string }[];
  activeConversationId: string | null;
};

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const isBiblePage = pathname === "/bible";
  const isChatPage = pathname === "/chat";
  const [bibleHeader, setBibleHeader] = useState<BibleHeaderState>({
    chapterLabel: "Bible",
    translation: "NIV",
  });
  const [chatTopbar, setChatTopbar] = useState<ChatTopbarState>({
    conversations: [],
    activeConversationId: null,
  });

  useEffect(() => {
    const handleBibleHeader = (event: Event) => {
      const customEvent = event as CustomEvent<BibleHeaderState>;
      if (!customEvent.detail) return;
      setBibleHeader({
        chapterLabel: customEvent.detail.chapterLabel || "Bible",
        translation: customEvent.detail.translation || "NIV",
      });
    };

    window.addEventListener("abide:bible-header", handleBibleHeader);
    return () => window.removeEventListener("abide:bible-header", handleBibleHeader);
  }, []);

  useEffect(() => {
    const handleChatTopbar = (event: Event) => {
      const customEvent = event as CustomEvent<ChatTopbarState>;
      if (!customEvent.detail) return;
      setChatTopbar({
        conversations: customEvent.detail.conversations ?? [],
        activeConversationId: customEvent.detail.activeConversationId ?? null,
      });
    };

    window.addEventListener("abide:chat-topbar", handleChatTopbar);
    return () => window.removeEventListener("abide:chat-topbar", handleChatTopbar);
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/login");
    router.refresh();
  };

  const handleOpenBibleNav = () => {
    window.dispatchEvent(new Event("abide:bible-open-nav-sheet"));
  };

  const handleNewChat = () => {
    window.dispatchEvent(new Event("abide:chat-new-conversation"));
  };

  const handleSelectConversation = (conversationId: string) => {
    window.dispatchEvent(
      new CustomEvent("abide:chat-select-conversation", {
        detail: { conversationId },
      })
    );
  };

  const handleDeleteConversation = (conversationId: string) => {
    window.dispatchEvent(
      new CustomEvent("abide:chat-delete-conversation", {
        detail: { conversationId },
      })
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-parchment/90 dark:bg-dark-bg/90 backdrop-blur-md border-b border-gold/10">
      <div className="flex items-center justify-between gap-2 h-14 px-4 min-h-14">
        <Link
          href="/"
          className="flex items-center gap-2 min-w-0 flex-1 rounded-lg -ml-1 pl-1 pr-2 py-1 transition-colors"
        >
          <Cross className="w-5 h-5 text-gold flex-shrink-0" strokeWidth={1.5} aria-hidden />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xl font-serif font-semibold text-ink dark:text-parchment tracking-tight truncate">
              Abide
            </span>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-gold/15 flex-shrink-0"
              aria-label="Open menu"
            >
              <MoreVertical className="h-4 w-4 text-ink dark:text-parchment" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:bg-red-500/10 focus:text-red-600 dark:focus:text-red-500"
              onClick={() => void handleLogout()}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isBiblePage ? (
        <div className="bg-parchment/95 dark:bg-dark-bg/95 backdrop-blur-sm border-t border-gold/10 px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl font-bold text-ink dark:text-parchment leading-tight">
              {bibleHeader.chapterLabel}
            </h1>
            <p className="text-[11px] text-muted tracking-wide uppercase">
              {bibleHeader.translation}
            </p>
          </div>
          <button
            onClick={handleOpenBibleNav}
            className="p-2 -mr-1 hover:bg-gold/10 rounded-lg transition-colors"
            aria-label="Open Bible settings"
          >
            <Menu className="w-5 h-5 text-ink dark:text-parchment" />
          </button>
        </div>
      ) : null}
      {isChatPage ? (
        <div className="bg-parchment/95 dark:bg-dark-bg/95 backdrop-blur-sm border-t border-gold/10 px-4 py-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-base font-semibold text-ink dark:text-parchment">
              Conversations
            </h2>
            <button
              onClick={handleNewChat}
              className="rounded-full bg-gold text-white text-xs font-semibold px-3 py-1.5"
            >
              New chat
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {chatTopbar.conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`flex-shrink-0 inline-flex items-center rounded-full text-xs border transition-colors ${
                  chatTopbar.activeConversationId === conversation.id
                    ? "bg-gold text-white border-gold"
                    : "bg-white dark:bg-dark-card text-muted border-gold/10"
                }`}
              >
                <button
                  onClick={() => handleSelectConversation(conversation.id)}
                  className="px-3 py-1.5"
                >
                  {conversation.title}
                </button>
                <button
                  onClick={() => handleDeleteConversation(conversation.id)}
                  className={cn(
                    "mr-1 p-1 rounded-full transition-colors",
                    chatTopbar.activeConversationId === conversation.id
                      ? "hover:bg-white/20"
                      : "hover:bg-gold/10"
                  )}
                  aria-label={`Delete ${conversation.title}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
