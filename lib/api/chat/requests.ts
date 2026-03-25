import type { ConversationItem, StoredMessage } from "@/features/chat/types";
import type { ChatMessage } from "@/types";

export async function fetchConversations(
  token: string
): Promise<ConversationItem[]> {
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
  return data.conversations ?? [];
}

export async function fetchMessages(
  token: string,
  conversationId: string
): Promise<StoredMessage[]> {
  const response = await fetch(
    `/api/chat/conversations/${conversationId}/messages`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = (await response.json()) as {
    messages?: StoredMessage[];
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error || "Unable to load messages.");
  }
  return data.messages ?? [];
}

export async function sendChatMessage(
  token: string,
  message: string,
  conversationId: string | null
): Promise<{
  conversationId?: string;
  encouragement?: ChatMessage["encouragement"];
  error?: string;
}> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, conversationId }),
  });

  const data = (await response.json()) as {
    conversationId?: string;
    encouragement?: ChatMessage["encouragement"];
    error?: string;
  };

  if (!response.ok || !data.encouragement) {
    throw new Error(
      data.error || "Unable to generate encouragement right now."
    );
  }

  return data;
}

export async function deleteConversation(
  token: string,
  conversationId: string
): Promise<void> {
  const response = await fetch(
    `/api/chat/conversations/${conversationId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error || "Unable to delete conversation.");
  }
}
