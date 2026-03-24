-- RAG schema for OpenAI embeddings + semantic retrieval
-- Run this in Supabase SQL editor after schema.sql

create extension if not exists vector;

create table if not exists public.documents (
  id bigserial primary key,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  source text,
  translation text check (translation in ('NIV', 'NLT')),
  book text,
  chapter int,
  verse int,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

alter table public.documents add column if not exists source text;
alter table public.documents add column if not exists translation text;
alter table public.documents add column if not exists book text;
alter table public.documents add column if not exists chapter int;
alter table public.documents add column if not exists verse int;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'documents_translation_check'
  ) then
    alter table public.documents
      add constraint documents_translation_check
      check (translation in ('NIV', 'NLT'));
  end if;
end $$;

create index if not exists documents_embedding_idx
  on public.documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists documents_metadata_idx
  on public.documents
  using gin (metadata);

create index if not exists documents_bible_lookup_idx
  on public.documents (translation, book, chapter, verse);

create unique index if not exists documents_reference_unique_idx
  on public.documents (translation, book, chapter, verse)
  where translation is not null and book is not null and chapter is not null and verse is not null;

create or replace function public.match_documents(
  query_embedding vector(1536),
  match_count int default 5,
  filter jsonb default '{}'::jsonb
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql
stable
as $$
  select
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where d.metadata @> filter
  order by d.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
