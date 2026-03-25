export interface Verse {
  reference: string;
  text: string;
}

export interface EncouragementResponse {
  intro: string;
  character?: {
    name: string;
    story: string;
    connection: string;
  };
  verses: Verse[];
  closing: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  encouragement?: EncouragementResponse;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  preview: string;
  lastMessage: string;
  timestamp: Date;
}

export interface FavoriteVerse {
  id: string;
  reference: string;
  text: string;
  savedAt: Date;
}
