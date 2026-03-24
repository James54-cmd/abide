import { NextRequest, NextResponse } from "next/server";
import { requireUserFromAuthHeader } from "@/lib/server/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireUserFromAuthHeader(
      request.headers.get("authorization")
    );

    const { data, error } = await supabase
      .from("chat_conversations")
      .select("id,title,updated_at,created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ conversations: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch conversations.";
    const status =
      message === "Unauthorized." ||
      message === "Missing bearer token." ||
      message === "Invalid bearer token."
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireUserFromAuthHeader(
      request.headers.get("authorization")
    );
    const body = (await request.json().catch(() => ({}))) as { title?: string };

    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        user_id: user.id,
        title: body.title?.trim() || "New conversation",
      })
      .select("id,title,updated_at,created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ conversation: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create conversation.";
    const status =
      message === "Unauthorized." ||
      message === "Missing bearer token." ||
      message === "Invalid bearer token."
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
