-- Create bible_favorites table
CREATE TABLE IF NOT EXISTS public.bible_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    translation TEXT NOT NULL,
    book_id TEXT NOT NULL,
    chapter_id TEXT NOT NULL,
    verse_start INTEGER NOT NULL,
    verse_end INTEGER NOT NULL,
    verse_reference TEXT NOT NULL,
    verse_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.bible_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own favorites"
    ON public.bible_favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
    ON public.bible_favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorites"
    ON public.bible_favorites FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
    ON public.bible_favorites FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bible_favorites_user_id ON public.bible_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_bible_favorites_user_chapter ON public.bible_favorites(user_id, chapter_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bible_favorites_updated_at
    BEFORE UPDATE ON public.bible_favorites
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
