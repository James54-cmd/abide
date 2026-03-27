export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_conversations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_messages: {
        Row: {
          id: number;
          conversation_id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          encouragement: Json | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          conversation_id: string;
          user_id: string;
          role: "user" | "assistant";
          content?: string;
          encouragement?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          conversation_id?: string;
          user_id?: string;
          role?: "user" | "assistant";
          content?: string;
          encouragement?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "chat_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      documents: {
        Row: {
          id: number;
          content: string;
          metadata: Json;
          embedding: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          content: string;
          metadata?: Json;
          embedding: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          content?: string;
          metadata?: Json;
          embedding?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          email: string;
          password_reset_token: string | null;
          password_reset_expires_at: string | null;
          password_reset_last_sent_at: string | null;
          email_change_pending: string | null;
          email_change_otp: string | null;
          email_change_otp_expires_at: string | null;
          email_change_otp_last_sent_at: string | null;
          email_change_cancel_token: string | null;
          email_change_cancel_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email: string;
          password_reset_token?: string | null;
          password_reset_expires_at?: string | null;
          password_reset_last_sent_at?: string | null;
          email_change_pending?: string | null;
          email_change_otp?: string | null;
          email_change_otp_expires_at?: string | null;
          email_change_otp_last_sent_at?: string | null;
          email_change_cancel_token?: string | null;
          email_change_cancel_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string;
          password_reset_token?: string | null;
          password_reset_expires_at?: string | null;
          password_reset_last_sent_at?: string | null;
          email_change_pending?: string | null;
          email_change_otp?: string | null;
          email_change_otp_expires_at?: string | null;
          email_change_otp_last_sent_at?: string | null;
          email_change_cancel_token?: string | null;
          email_change_cancel_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_documents: {
        Args: {
          query_embedding: string;
          match_count?: number;
          filter?: Json;
        };
        Returns: {
          id: number;
          content: string;
          metadata: Json;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
