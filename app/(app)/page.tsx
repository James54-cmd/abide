"use client";

import { useEffect, useState } from "react";
import { gql } from "@apollo/client";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import VerseOfTheDay from "@/components/VerseOfTheDay";
import EncouragementInput from "@/components/EncouragementInput";
import { getApolloClient } from "@/lib/graphql/client";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  extractFirstName,
  getDailyVerse,
  getGreeting,
  timeAgo,
} from "@/lib/home-helpers";

type ConversationItem = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
};

type RecentConversation = {
  id: string;
  preview: string;
  lastMessage: string;
  timestamp: Date;
};

const CHAT_CONVERSATIONS_QUERY = gql`
  query ChatConversations {
    chatConversations {
      id
      title
      updatedAt
      createdAt
    }
  }
`;

export default function HomePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);

  const getAccessToken = async () => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      throw new Error("Please log in again.");
    }
    return data.session.access_token;
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const metadata = data.session?.user?.user_metadata as {
        first_name?: unknown;
        full_name?: unknown;
      } | undefined;

      setFirstName(extractFirstName(metadata));

      try {
        const token = await getAccessToken();
        const client = getApolloClient();
        const { data } = await client.query<{ chatConversations?: ConversationItem[] }>({
          query: CHAT_CONVERSATIONS_QUERY,
          fetchPolicy: "no-cache",
          context: { headers: { Authorization: `Bearer ${token}` } },
        });

        const mapped = (data?.chatConversations ?? []).slice(0, 5).map((conversation) => ({
          id: conversation.id,
          preview: conversation.title || "Untitled conversation",
          lastMessage: "Tap to continue your conversation",
          timestamp: new Date(conversation.updatedAt),
        }));

        setRecentConversations(mapped);
      } catch {
        setRecentConversations([]);
      }
    };

    void loadDashboardData();
  }, []);

  const handleSend = (message: string) => {
    router.push(`/chat?q=${encodeURIComponent(message)}`);
  };

  return (
    <PageTransition>
      <div className="px-4 pt-6 pb-4 space-y-6">
        {/* Soft glow backdrop */}
        <div className="pointer-events-none fixed inset-0 max-w-[430px] mx-auto overflow-hidden">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-0 w-48 h-48 bg-gold/3 rounded-full blur-2xl" />
        </div>

        {/* Greeting */}
        <div className="relative">
          <h2 className="text-2xl font-serif font-semibold text-ink dark:text-parchment">
            {getGreeting(firstName)}
          </h2>
          <p className="text-sm text-muted mt-1">
            Let God&apos;s Word speak into your day.
          </p>
        </div>

        {/* Verse of the Day */}
        <VerseOfTheDay verse={getDailyVerse()} />

        {/* Prompt input */}
        <EncouragementInput onSend={handleSend} />

        {/* Recent encouragements */}
        <div className="relative">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            Recent Encouragements
          </h3>
          <div className="space-y-2">
            {recentConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => router.push("/chat")}
                className="w-full flex items-center justify-between bg-white dark:bg-dark-card rounded-2xl px-4 py-3.5 shadow-warm border border-gold/5 transition-all active:scale-[0.98]"
              >
                <div className="text-left min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink dark:text-parchment truncate">
                    {conv.preview}
                  </p>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {conv.lastMessage}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                  <span className="text-[10px] text-muted">
                    {timeAgo(conv.timestamp)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted" />
                </div>
              </button>
            ))}
            {recentConversations.length === 0 && (
              <p className="text-sm text-muted px-1">
                No recent encouragements yet. Share what is on your heart to begin.
              </p>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
