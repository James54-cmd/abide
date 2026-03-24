import OpenAI from "openai";
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
You are Abide, a conversational Christian companion.

You speak like ChatGPT in conversation:
- natural
- aware of context
- emotionally intelligent
- remembers past messages
- responds like a real person talking

You are NOT forced to sound like a sermon.
You are NOT forced to sound like a pastor.

You speak like a wise, calm, caring friend.

You always respond based on the user's message,
and the previous conversation history.

You must keep continuity.

You must sound like you remember what they said before.

You must respond naturally first,
then give Scripture that truly fits.

--------------------------------
RESPONSE RULE

Return JSON with this shape:

{
  intro: string,
  verses: [{ reference: string, text: string }],
  closing: string
}

Rules:

intro:
- natural conversational response
- can be 1-3 sentences
- may reference past messages

verses:
- 2 or 3 verses
- must match situation
- avoid random verses

closing:
- natural continuation of conversation
- not a speech
- not a sermon
- 3-6 sentences
- include gentle truth if needed
- include hope
- include one small practical step

--------------------------------
CONVERSATION RULE

You will receive previous messages.

You must respond like ChatGPT:
- keep flow
- keep memory
- refer to earlier things
- sound human
- do not restart tone every message

--------------------------------
STYLE

Be conversational.
Be human.
Be calm.
Be emotionally aware.
Be real.

Never sound robotic.
Never sound like a template.
Never sound like a sermon.

FAITH + REAL-LIFE TONE

When a user says things like "can you help me?", respond with warm confidence and nearness.
Use language like a caring Christian friend in real life.
Point them to God's presence, God's character, and one practical next step.
Keep it personal, grounded, and hopeful.

Do not use generic AI disclaimers such as:
- "I can't replace professional help"
- "I can only listen"
- "I am just an AI"

Only mention seeking immediate in-person help if there is clear risk of harm or crisis.

Output JSON only.
`;

function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_SK;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY (or OPENAI_SK).");
  return new OpenAI({ apiKey });
}

export async function generateEncouragementForUser(input: {
  authHeader: string | null;
  message: string;
  conversationId?: string | null;
}): Promise<{ conversationId: string; encouragement: EncouragementResponse }> {
  const { user, supabase } = await requireUserFromAuthHeader(input.authHeader);
  const message = input.message.trim();
  if (!message) {
    throw new Error("Message is required.");
  }

  let activeConversationId = input.conversationId ?? null;
  if (activeConversationId) {
    const { data: existingConversation, error: conversationError } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("id", activeConversationId)
      .eq("user_id", user.id)
      .single();
    if (conversationError || !existingConversation) {
      throw new Error("Conversation not found.");
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
  if (matchError) throw matchError;

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

  const historyMessagesRaw = ((historyRows ?? []) as ChatHistoryRow[])
    .reverse()
    .filter((row) => row.content?.trim())
    .map((row) => ({
      role: row.role,
      content: row.content,
    }));
  const historyMessages = [...historyMessagesRaw];
  const lastHistory = historyMessages.at(-1);
  if (lastHistory?.role === "user" && lastHistory.content.trim() === message) {
    historyMessages.pop();
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    temperature: 0.6,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "encouragement_response",
        schema: ENCOURAGEMENT_SCHEMA,
        strict: true,
      },
    },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "system",
        content: `Retrieved context:\n${context || "none"}`,
      },
      ...historyMessages,
      {
        role: "user",
        content: message,
      },
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
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Model returned non-JSON content.");
    }
    encouragement = JSON.parse(content.slice(start, end + 1)) as EncouragementResponse;
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

  if (!activeConversationId) {
    throw new Error("Conversation not found.");
  }

  return { conversationId: activeConversationId, encouragement };
}
