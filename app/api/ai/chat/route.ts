import { NextRequest, NextResponse } from "next/server";
import { generateEncouragementForUser } from "@/lib/server/chat-generation";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { message?: string; conversationId?: string | null };
    const message = body.message?.trim() ?? "";
    const result = await generateEncouragementForUser({
      authHeader: request.headers.get("authorization"),
      message,
      conversationId: body.conversationId ?? null,
    });

    return NextResponse.json({
      conversationId: result.conversationId,
      encouragement: result.encouragement,
    });
  } catch (error) {
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : "Failed to generate encouragement.";
    const status =
      message === "Unauthorized." ||
      message === "Missing bearer token." ||
      message === "Invalid bearer token."
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
