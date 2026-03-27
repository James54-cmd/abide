import { SupabaseClient } from "@supabase/supabase-js";

export type MatchDocumentRow = {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
};

export async function matchDocuments(
  supabase: SupabaseClient,
  queryEmbedding: number[],
  matchCount: number = 4,
  filter: Record<string, unknown> = {}
) {
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    filter,
  });

  if (error) throw error;
  return (data ?? []) as MatchDocumentRow[];
}
