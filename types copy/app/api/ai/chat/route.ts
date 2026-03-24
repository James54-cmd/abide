import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import type { EncouragementResponse } from "@/types";
import { requireUserFromAuthHeader } from "@/lib/server/supabase-admin";

type MatchDocumentRow = {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
};

type ChatHistoryRow = {
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

const ENCOURAGEMENT_SCHEMA = {
  type: "object",
  properties: {
    intro: { type: "string" },
    verses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          reference: { type: "string" },
          text: { type: "string" },
        },
        required: ["reference", "text"],
        additionalProperties: false,
      },
      minItems: 2,
      maxItems: 3,
    },
    closing: { type: "string" },
  },
  required: ["intro", "verses", "closing"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `
You are Abide - a Spirit-led, Scripture-rooted companion for real people going through real life.

You are not a motivational speaker.
You are not a preacher.
You are not a therapist.

You are a wise, warm, emotionally intelligent Christian friend who speaks truth with love,
and always points people back to God's Word in a natural, human way.

--------------------------------
PERSONALITY
--------------------------------

- Speak like a trusted friend sitting beside them, not a pastor behind a pulpit
- Warm, calm, honest, grounded, and human
- Emotionally aware - notice what they feel even if they do not say it directly
- Truthful but gentle - you may lovingly correct wrong thinking when needed
- Never sound robotic, formal, preachy, or like a sermon
- Never give long theological lectures
- Keep language simple, natural, and conversational

--------------------------------
CORE RULE
--------------------------------

Every encouragement must flow FROM Scripture, not toward Scripture.

Do not add random verses.
Do not add generic verses.
Choose verses that clearly match the user's situation.

--------------------------------
RESPONSE STRUCTURE (STRICT)
--------------------------------

Return JSON with EXACT shape:

{
  intro: string,
  verses: [{ reference: string, text: string }],
  closing: string
}

Rules:

1. intro
   - 1-2 sentences
   - empathetic
   - specific to what the user said
   - sound human, not scripted

2. verses
   - 2 or 3 verses only
   - NIV or NLT style wording
   - must directly relate to the user's situation
   - avoid repeating the same verses often
   - avoid famous verses unless they truly fit

3. closing
   - 3-5 sentences
   - reflect their exact situation
   - include gentle truth if needed
   - include hope rooted in Scripture
   - end with ONE practical step they can do today
   - practical step must be realistic and small

--------------------------------
CONTINUITY RULE
--------------------------------

You will receive previous conversation messages.

You must:
- remember what the user shared earlier
- keep emotional continuity
- do not respond like this is a new conversation
- reference past struggles when relevant
- sound like you truly remember them

--------------------------------
CORRECTION RULE
--------------------------------

If the user shows:

- self-pity
- hopeless thinking
- guilt / shame
- anger
- sin / harmful behavior
- lies about themselves
- wrong beliefs about God

You must respond with gentle truth,
not harsh correction,
not agreement with lies.

Speak truth with kindness.

--------------------------------
CRISIS RULE
--------------------------------

If the user sounds overwhelmed, broken, or in emotional crisis:

- speak slower
- be extra gentle
- acknowledge pain first
- give comforting verses
- encourage reaching out to trusted people
- never diagnose
- never give medical advice

--------------------------------
STYLE RULES
--------------------------------

DO:
- natural language
- short paragraphs
- calm tone
- emotionally aware
- specific to the message

DO NOT:
- preach
- lecture
- sound like a sermon
- use church cliches
- use fake poetic language
- give long speeches
- ignore what the user said

--------------------------------
OUTPUT MUST BE VALID JSON ONLY
--------------------------------
`;

function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_SK;

  if (!apiKey) throw new Error("Missing OPENAI_API_KEY (or OPENAI_SK).");

  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireUserFromAuthHeader(
      request.headers.get("authorization")
    );
    const body = (await request.json()) as { message?: string; conversationId?: string | null };
    const message = body.message?.trim();
    const conversationId = body.conversationId ?? null;

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    let activeConversationId = conversationId;
    if (activeConversationId) {
      const { data: existingConversation, error: conversationError } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("id", activeConversationId)
        .eq("user_id", user.id)
        .single();
      if (conversationError || !existingConversation) {
        return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
      }
    } else {
      const title = message.length > 45 ? `${message.slice(0, 45)}...` : message;
      const { data: createdConversation, error: createError } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();

      if (createError || !createdConversation) {
        throw createError ?? new Error("Unable to create conversation.");
      }
      activeConversationId = createdConversation.id;
    }

    const { error: userMessageError } = await supabase.from("chat_messages").insert({
      conversation_id: activeConversationId,
      user_id: user.id,
      role: "user",
      content: message,
    });
    if (userMessageError) throw userMessageError;

    const openai = getOpenAiClient();
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: message,
    });
    const queryEmbedding = embedding.data[0]?.embedding;
    if (!queryEmbedding) {
      throw new Error("Failed to generate embedding.");
    }

    const { data: contextRows, error: matchError } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_count: 5,
      filter: {},
    });
    if (matchError) {
      throw matchError;
    }

    const context = ((contextRows ?? []) as MatchDocumentRow[])
      .map((row) => `- ${row.content}`)
      .join("\n");

    const { data: historyRows, error: historyError } = await supabase
      .from("chat_messages")
      .select("role,content,created_at")
      .eq("conversation_id", activeConversationId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(14);
    if (historyError) throw historyError;

    const historyMessages = ((historyRows ?? []) as ChatHistoryRow[])
      .reverse()
      .filter((row) => row.content?.trim())
      .map((row) => ({
        role: row.role,
        content: row.content,
      }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "encouragement_response",
          schema: ENCOURAGEMENT_SCHEMA,
          strict: true,
        },
      },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "system",
          content: `Retrieved context for grounding:\n${context || "- No retrieved context."}`,
        },
        ...historyMessages,
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content from model.");
    }

    let encouragement: EncouragementResponse;
    try {
      encouragement = JSON.parse(content) as EncouragementResponse;
    } catch {
      // Some model responses still include extra wrapper text; recover first JSON object.
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      if (start === -1 || end === -1 || end <= start) {
        throw new Error("Model returned non-JSON content.");
      }
      const jsonSlice = content.slice(start, end + 1);
      encouragement = JSON.parse(jsonSlice) as EncouragementResponse;
    }

    const { error: aiMessageError } = await supabase.from("chat_messages").insert({
      conversation_id: activeConversationId,
      user_id: user.id,
      role: "assistant",
      content: `${encouragement.intro}\n\n${encouragement.closing}`,
      encouragement,
    });
    if (aiMessageError) throw aiMessageError;

    const { error: conversationUpdateError } = await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", activeConversationId)
      .eq("user_id", user.id);
    if (conversationUpdateError) throw conversationUpdateError;

    return NextResponse.json({
      conversationId: activeConversationId,
      encouragement,
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
