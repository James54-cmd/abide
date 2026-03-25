"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { fetchConversations } from "@/lib/api/chat/requests";
import type { ConversationItem } from "@/features/chat/types";

function getGreeting(firstName?: string | null): string {
  const hour = new Date().getHours();
  const name = firstName?.trim() || "beloved";
  if (hour < 12) return `Good morning, ${name} ☀️`;
  if (hour < 17) return `Good afternoon, ${name} 🌤️`;
  return `Good evening, ${name} 🌙`;
}

export function useHomeState() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    
    // Load first name
    const metadata = data.session?.user?.user_metadata as
      | { first_name?: unknown; full_name?: unknown }
      | undefined;

    const rawFirstName =
      typeof metadata?.first_name === "string"
        ? metadata.first_name
        : typeof metadata?.full_name === "string"
          ? metadata.full_name.split(" ")[0]
          : "";

    setFirstName(rawFirstName.trim() || null);

    // Load conversations if we have a token
    if (token) {
      try {
        const list = await fetchConversations(token);
        setConversations(list.slice(0, 3)); // Only show top 3 for home
      } catch (err) {
        console.error("Home: Failed to load conversations", err);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const greeting = getGreeting(firstName);

  return { firstName, greeting, conversations, isLoading };
}

export type HomeState = ReturnType<typeof useHomeState>;
