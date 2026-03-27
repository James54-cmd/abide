"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Cross, Menu, MessageSquare, Plus, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fetchMySettingsProfile } from "@/lib/graphql/settings/hooks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


type BibleHeaderState = {
  chapterLabel: string;
  translation: string;
};

type ChatTopbarState = {
  conversations: { id: string; title: string }[];
  activeConversationId: string | null;
};

type ProfileTopbarState = {
  avatarUrl: string | null;
};

export default function TopBar() {
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
  const [profileTopbar, setProfileTopbar] = useState<ProfileTopbarState>({
    avatarUrl: null,
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
    async function loadProfileForTopbar() {
      try {
        const profile = await fetchMySettingsProfile();
        setProfileTopbar({ avatarUrl: profile.avatarUrl ?? null });
      } catch {
        // Keep default icon if profile cannot be loaded.
      }
    }

    const handleProfileTopbar = (event: Event) => {
      const customEvent = event as CustomEvent<ProfileTopbarState>;
      if (!customEvent.detail) return;
      setProfileTopbar({
        avatarUrl: customEvent.detail.avatarUrl ?? null,
      });
    };

    void loadProfileForTopbar();
    window.addEventListener("abide:profile-topbar", handleProfileTopbar);
    return () => window.removeEventListener("abide:profile-topbar", handleProfileTopbar);
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
        <Link href="/settings" aria-label="Open profile">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-gold/15 flex-shrink-0 bg-gold/5"
              aria-label="Open profile"
            >
              {profileTopbar.avatarUrl ? (
                <Image
                  src={profileTopbar.avatarUrl}
                  alt="Profile avatar"
                  width={32}
                  height={32}
                  unoptimized
                  className="h-8 w-8 rounded-full object-cover border border-gold/20"
                />
              ) : (
                <User className="h-4 w-4 text-gold" strokeWidth={2} />
              )}
            </Button>
        </Link>
      </div>
      {isBiblePage ? (
        <div className="bg-parchment/95 dark:bg-dark-bg/95 backdrop-blur-sm border-t border-gold/10 px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl font-bold text-ink dark:text-parchment leading-tight truncate max-w-[240px]">
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
        <div className="bg-parchment/95 dark:bg-dark-bg/95 backdrop-blur-sm border-t border-gold/10 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <MessageSquare className="w-4 h-4 text-gold/60" />
               <h2 className="font-serif text-sm font-black text-black dark:text-parchment/60 uppercase tracking-[0.2em]">
                 Conversations
               </h2>
            </div>
            <button
              onClick={handleNewChat}
              className="group flex items-center gap-1.5 rounded-full bg-gold hover:bg-gold/90 text-white text-[11px] font-bold px-3 py-1.5 transition-all shadow-md shadow-gold/20 active:scale-95"
            >
              <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform duration-300" />
              New chat
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1 -my-1">
            {chatTopbar.conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "flex-shrink-0 inline-flex items-center rounded-xl text-xs border transition-all duration-300",
                  chatTopbar.activeConversationId === conversation.id
                    ? "bg-gold text-white border-gold shadow-lg shadow-gold/25 scale-[1.02]"
                    : "bg-white/60 dark:bg-dark-card/60 text-muted border-gold/10 hover:border-gold/30 hover:bg-white dark:hover:bg-dark-card"
                )}
              >
                <button
                  onClick={() => handleSelectConversation(conversation.id)}
                  className="px-4 py-2 font-medium tracking-tight truncate max-w-[140px]"
                >
                  {conversation.title}
                </button>
                <button
                  onClick={() => handleDeleteConversation(conversation.id)}
                  className={cn(
                    "mr-1 p-1.5 rounded-lg transition-colors group/delete",
                    chatTopbar.activeConversationId === conversation.id
                      ? "hover:bg-white/20 text-white/60 hover:text-white"
                      : "hover:bg-red-50 text-muted/30 hover:text-red-500"
                  )}
                  aria-label={`Delete ${conversation.title}`}
                >
                  <X className={cn(
                    "w-3 h-3",
                    chatTopbar.activeConversationId === conversation.id ? "stroke-[2.5]" : "stroke-[1.5]"
                  )} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
