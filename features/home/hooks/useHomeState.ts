"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

function getGreeting(firstName?: string | null): string {
  const hour = new Date().getHours();
  const name = firstName?.trim() || "beloved";
  if (hour < 12) return `Good morning, ${name} ☀️`;
  if (hour < 17) return `Good afternoon, ${name} 🌤️`;
  return `Good evening, ${name} 🌙`;
}

export function useHomeState() {
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    const loadFirstName = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
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
    };

    void loadFirstName();
  }, []);

  const greeting = getGreeting(firstName);

  return { firstName, greeting };
}

export type HomeState = ReturnType<typeof useHomeState>;
