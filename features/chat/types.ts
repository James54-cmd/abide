export type ConversationItem = {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
};

export type StoredMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  encouragement: import("@/types").ChatMessage["encouragement"] | null;
  created_at: string;
};
