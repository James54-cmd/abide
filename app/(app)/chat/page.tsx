"use client";

import { useState, useEffect, useCallback } from "react";
import { gql } from "@apollo/client";
import PageTransition from "@/components/PageTransition";
import ChatBubble from "@/components/ChatBubble";
import EmptyState from "@/components/ui/EmptyState";
import LoadingDots from "@/components/LoadingDots";
import { getApolloClient } from "@/lib/graphql/client";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { ChatMessage, Verse } from "@/types";

type ConversationItem = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
};

type StoredMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  encouragement: ChatMessage["encouragement"] | null;
  createdAt: string;
};

type ChatBootstrapPayload = {
  conversations: ConversationItem[];
  messages: StoredMessage[];
  activeConversationId: string | null;
};

const CHAT_BOOTSTRAP_QUERY = gql`
  query ChatBootstrap($conversationId: String, $includeMessages: Boolean) {
    chatBootstrap(conversationId: $conversationId, includeMessages: $includeMessages) {
      conversations {
        id
        title
        updatedAt
        createdAt
      }
      messages {
        id
        role
        content
        encouragement {
          intro
          verses {
            reference
            text
          }
          closing
        }
        createdAt
      }
      activeConversationId
    }
  }
`;

const DELETE_CHAT_CONVERSATION_MUTATION = gql`
  mutation DeleteChatConversation($id: String!) {
    deleteChatConversation(id: $id)
  }
`;

const GENERATE_ENCOURAGEMENT_MUTATION = gql`
  mutation GenerateEncouragement($input: GenerateEncouragementInput!) {
    generateEncouragement(input: $input) {
      conversationId
      encouragement {
        intro
        verses {
          reference
          text
        }
        closing
      }
    }
  }
`;

function mapRowsToChatMessages(rows: StoredMessage[]): ChatMessage[] {
  return rows.map(
    (msg) =>
      ({
        id: `${msg.role}-${msg.id}`,
        role: msg.role,
        content: msg.content,
        encouragement: msg.encouragement ?? undefined,
        timestamp: new Date(msg.createdAt),
      }) as ChatMessage
  );
}

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

  const loadChatBootstrap = useCallback(
    async (args: {
      conversationId?: string | null;
      includeMessages: boolean;
      signal?: AbortSignal;
    }) => {
      if (args.includeMessages) {
        setIsLoading(true);
      }
      try {
        const token = await getAccessToken();
        if (args.signal?.aborted) return;
        const client = getApolloClient();
        const { data } = await client.query<{ chatBootstrap?: ChatBootstrapPayload }>({
          query: CHAT_BOOTSTRAP_QUERY,
          variables: {
            conversationId: args.conversationId ?? null,
            includeMessages: args.includeMessages,
          },
          fetchPolicy: "no-cache",
          context: {
            headers: { Authorization: `Bearer ${token}` },
            ...(args.signal ? { fetchOptions: { signal: args.signal } } : {}),
          },
        });
        if (args.signal?.aborted) return;

        const payload = data?.chatBootstrap;
        if (!payload) {
          throw new Error("Unable to load chat.");
        }

        setConversations(payload.conversations);

        if (args.includeMessages) {
          setActiveConversationId(payload.activeConversationId);
          setMessages(mapRowsToChatMessages(payload.messages ?? []));
        }
      } catch {
        if (!args.signal?.aborted && args.includeMessages) {
          setConversations([]);
          setMessages([]);
          setActiveConversationId(null);
        }
      } finally {
        if (!args.signal?.aborted && args.includeMessages) {
          setIsLoading(false);
        }
      }
    },
    [getAccessToken]
  );

  useEffect(() => {
    const abortController = new AbortController();

    const run = async () => {
      try {
        await loadChatBootstrap({
          includeMessages: true,
          signal: abortController.signal,
        });
      } finally {
        if (!abortController.signal.aborted) {
          setIsBootstrapping(false);
        }
      }
    };

    void run();
    return () => abortController.abort();
  }, [loadChatBootstrap]);

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  useEffect(() => {
    const onNewConversation = () => handleNewConversation();
    window.addEventListener("abide:chat-new-conversation", onNewConversation);
    return () => window.removeEventListener("abide:chat-new-conversation", onNewConversation);
  }, []);

  const handleSelectConversation = useCallback(
    async (conversationId: string) => {
      await loadChatBootstrap({
        conversationId,
        includeMessages: true,
      });
    },
    [loadChatBootstrap]
  );

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

  const handleDeleteConversation = useCallback(
    async (conversationId: string) => {
      const token = await getAccessToken();
      const client = getApolloClient();
      await client.mutate({
        mutation: DELETE_CHAT_CONVERSATION_MUTATION,
        variables: { id: conversationId },
        context: { headers: { Authorization: `Bearer ${token}` } },
      });

      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
    },
    [activeConversationId, getAccessToken]
  );

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

  const handleSend = useCallback(
    async (text: string) => {
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
        const client = getApolloClient();
        const { data } = await client.mutate<{
          generateEncouragement?: {
            conversationId: string;
            encouragement: ChatMessage["encouragement"];
          };
        }>({
          mutation: GENERATE_ENCOURAGEMENT_MUTATION,
          variables: { input: { message: text, conversationId: activeConversationId } },
          context: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });
        const payload = data?.generateEncouragement;
        if (!payload?.encouragement) {
          throw new Error("Unable to generate encouragement right now.");
        }

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: "",
          encouragement: payload.encouragement,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        const newActiveId = payload.conversationId || activeConversationId;
        if (payload.conversationId && !activeConversationId) {
          setActiveConversationId(payload.conversationId);
        }

        await loadChatBootstrap({
          conversationId: newActiveId,
          includeMessages: false,
        });
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
    },
    [activeConversationId, getAccessToken, loadChatBootstrap]
  );

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
