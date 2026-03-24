import { NextRequest, NextResponse } from "next/server";
import { requireUserFromAuthHeader } from "@/lib/server/supabase-admin";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { user, supabase } = await requireUserFromAuthHeader(
      request.headers.get("authorization")
    );

    const { data: conversation, error: convError } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .select("id,role,content,encouragement,created_at")
      .eq("conversation_id", params.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ messages: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch messages.";
    const status =
      message === "Unauthorized." ||
      message === "Missing bearer token." ||
      message === "Invalid bearer token."
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
