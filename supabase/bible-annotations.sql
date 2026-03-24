-- Bible highlights and notes (run in Supabase SQL editor)

create table if not exists public.bible_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  translation text not null check (translation in ('NIV', 'NLT')),
  book_id text not null,
  chapter_id text not null,
  verse_start int not null check (verse_start > 0),
  verse_end int not null check (verse_end >= verse_start),
  color text not null default 'gold',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bible_highlights_user_location_idx
  on public.bible_highlights (user_id, translation, book_id, chapter_id, verse_start);

alter table public.bible_highlights enable row level security;

drop policy if exists "Users manage own bible highlights" on public.bible_highlights;
create policy "Users manage own bible highlights"
  on public.bible_highlights
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_bible_highlights_updated_at on public.bible_highlights;
create trigger set_bible_highlights_updated_at
before update on public.bible_highlights
for each row execute procedure public.set_updated_at();

create table if not exists public.bible_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  translation text not null check (translation in ('NIV', 'NLT')),
  book_id text not null,
  chapter_id text not null,
  verse_start int not null check (verse_start > 0),
  verse_end int not null check (verse_end >= verse_start),
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bible_notes_user_location_idx
  on public.bible_notes (user_id, translation, book_id, chapter_id, verse_start);

alter table public.bible_notes enable row level security;

drop policy if exists "Users manage own bible notes" on public.bible_notes;
create policy "Users manage own bible notes"
  on public.bible_notes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_bible_notes_updated_at on public.bible_notes;
create trigger set_bible_notes_updated_at
before update on public.bible_notes
for each row execute procedure public.set_updated_at();
