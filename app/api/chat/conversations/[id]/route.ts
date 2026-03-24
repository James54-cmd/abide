import { NextRequest, NextResponse } from "next/server";
import { requireUserFromAuthHeader } from "@/lib/server/supabase-admin";

type Params = {
  params: {
    id: string;
  };
};

export async function DELETE(request: NextRequest, { params }: Params) {
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

    const { error } = await supabase
      .from("chat_conversations")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete conversation.";
    const status =
      message === "Unauthorized." ||
      message === "Missing bearer token." ||
      message === "Invalid bearer token."
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
