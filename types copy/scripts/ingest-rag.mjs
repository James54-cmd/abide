import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openAiApiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_SK;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!openAiApiKey) {
  throw new Error("Missing OPENAI_API_KEY (or OPENAI_SK) in environment.");
}
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase env vars for ingestion.");
}

const openai = new OpenAI({ apiKey: openAiApiKey });
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const records = [
  {
    content:
      "When someone is anxious, remind them God is near and invite them to cast worries on Him in prayer.",
    metadata: { topic: "anxiety", source: "seed" },
  },
  {
    content:
      "When someone feels alone, encourage them with the promise that God never leaves nor forsakes His children.",
    metadata: { topic: "loneliness", source: "seed" },
  },
  {
    content:
      "When someone is grieving, respond with gentle compassion and point to God's comfort for the brokenhearted.",
    metadata: { topic: "grief", source: "seed" },
  },
  {
    content:
      "When someone feels fearful about the future, remind them that God's plans are good and He gives daily strength.",
    metadata: { topic: "fear", source: "seed" },
  },
];

async function main() {
  const shouldReset = process.argv.includes("--reset");
  if (shouldReset) {
    const { error } = await supabase.from("documents").delete().gte("id", 0);
    if (error) throw error;
    console.log("Cleared existing documents.");
  }

  for (const record of records) {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: record.content,
    });

    const embedding = embeddingResponse.data[0]?.embedding;
    if (!embedding) {
      throw new Error("Embedding generation failed.");
    }

    const { error } = await supabase.from("documents").insert({
      content: record.content,
      metadata: record.metadata,
      embedding,
    });
    if (error) throw error;
  }

  console.log(`Ingested ${records.length} RAG documents.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
