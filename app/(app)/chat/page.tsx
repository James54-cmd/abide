"use client";

import { useState, useEffect, useCallback } from "react";
import PageTransition from "@/components/PageTransition";
import ChatBubble from "@/components/ChatBubble";
import EmptyState from "@/components/ui/EmptyState";
import LoadingDots from "@/components/LoadingDots";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { ChatMessage, Verse } from "@/types";

type ConversationItem = {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
};

type StoredMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  encouragement: ChatMessage["encouragement"] | null;
  created_at: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const getAccessToken = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      throw new Error("Please log in again.");
    }
    return data.session.access_token;
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const token = await getAccessToken();
    const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await response.json()) as { messages?: StoredMessage[]; error?: string };
    if (!response.ok) {
      throw new Error(data.error || "Unable to load messages.");
    }

    const mapped = (data.messages ?? []).map((msg) => ({
      id: `${msg.role}-${msg.id}`,
      role: msg.role,
      content: msg.content,
      encouragement: msg.encouragement ?? undefined,
      timestamp: new Date(msg.created_at),
    })) as ChatMessage[];

    setMessages(mapped);
  }, [getAccessToken]);

  const loadConversations = useCallback(async () => {
    const token = await getAccessToken();
    const response = await fetch("/api/chat/conversations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await response.json()) as {
      conversations?: ConversationItem[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error || "Unable to load conversations.");
    }

    const list = data.conversations ?? [];
    setConversations(list);
    return list;
  }, [getAccessToken]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const list = await loadConversations();
        if (list.length > 0) {
          setActiveConversationId(list[0].id);
          await loadMessages(list[0].id);
        }
      } catch {
        setConversations([]);
        setMessages([]);
      } finally {
        setIsBootstrapping(false);
      }
    };
    bootstrap();
  }, [loadConversations, loadMessages]);

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  useEffect(() => {
    const onNewConversation = () => handleNewConversation();
    window.addEventListener("abide:chat-new-conversation", onNewConversation);
    return () => window.removeEventListener("abide:chat-new-conversation", onNewConversation);
  }, []);

  const handleSelectConversation = useCallback(async (conversationId: string) => {
    setActiveConversationId(conversationId);
    setIsLoading(true);
    try {
      await loadMessages(conversationId);
    } finally {
      setIsLoading(false);
    }
  }, [loadMessages]);

  useEffect(() => {
    const onSelectConversation = (event: Event) => {
      const customEvent = event as CustomEvent<{ conversationId?: string }>;
      const id = customEvent.detail?.conversationId;
      if (!id) return;
      void handleSelectConversation(id);
    };
    window.addEventListener("abide:chat-select-conversation", onSelectConversation);
    return () => window.removeEventListener("abide:chat-select-conversation", onSelectConversation);
  }, [handleSelectConversation]);

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    const token = await getAccessToken();
    const response = await fetch(`/api/chat/conversations/${conversationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      throw new Error(data.error || "Unable to delete conversation.");
    }

    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [activeConversationId, getAccessToken]);

  useEffect(() => {
    const onDeleteConversation = (event: Event) => {
      const customEvent = event as CustomEvent<{ conversationId?: string }>;
      const id = customEvent.detail?.conversationId;
      if (!id) return;
      void handleDeleteConversation(id);
    };
    window.addEventListener("abide:chat-delete-conversation", onDeleteConversation);
    return () => window.removeEventListener("abide:chat-delete-conversation", onDeleteConversation);
  }, [handleDeleteConversation]);

  const handleSend = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const token = await getAccessToken();
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text, conversationId: activeConversationId }),
      });

      const data = (await response.json()) as {
        conversationId?: string;
        encouragement?: ChatMessage["encouragement"];
        error?: string;
      };

      if (!response.ok || !data.encouragement) {
        throw new Error(data.error || "Unable to generate encouragement right now.");
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: "",
        encouragement: data.encouragement,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (data.conversationId && !activeConversationId) {
        setActiveConversationId(data.conversationId);
      }
      await loadConversations();
    } catch {
      const fallback: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        role: "assistant",
        content: "",
        encouragement: {
          intro: "I am having trouble responding right now, but God is still near to you.",
          verses: [
            {
              reference: "Psalm 46:1",
              text: "God is our refuge and strength, an ever-present help in trouble.",
            },
            {
              reference: "Matthew 11:28",
              text: "Come to me, all you who are weary and burdened, and I will give you rest.",
            },
          ],
          closing:
            "Take a deep breath and bring this to the Lord in prayer. You are not alone.",
        },
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId, getAccessToken, loadConversations]);

  useEffect(() => {
    const onSend = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const message = customEvent.detail?.message?.trim();
      if (!message || isLoading) return;
      void handleSend(message);
    };
    window.addEventListener("abide:chat-send", onSend);
    return () => window.removeEventListener("abide:chat-send", onSend);
  }, [handleSend, isLoading]);

  const handleBookmark = (verse: Verse) => {
    // Phase 2: Save to Supabase favorites
    console.log("Bookmarked:", verse.reference);
  };

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("abide:chat-topbar", {
        detail: {
          conversations: conversations.map((c) => ({ id: c.id, title: c.title })),
          activeConversationId,
        },
      })
    );
  }, [conversations, activeConversationId]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("abide:chat-composer-state", {
        detail: { disabled: isLoading },
      })
    );
  }, [isLoading]);

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
