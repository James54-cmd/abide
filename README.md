# Abide

Abide is a faith-centered Next.js app with Bible reading, chat encouragement, notes/highlights, and saved verses.

## Tech Stack

- `Next.js 14` + `React 18` + `TypeScript`
- `Tailwind CSS` + `Framer Motion`
- `Supabase` (auth + data + realtime)
- `GraphQL` (Apollo client + server route at `app/api/graphql/route.ts`)
- `OpenAI` (encouragement generation + RAG ingestion)
- `API.Bible` (book/chapter/verse content)

## Features

- Bible reader with translation support (`NIV` / `NLT`)
- Verse actions: highlight, note, copy, favorite
- Favorites page with full book names + remove confirmation modal
- Chat encouragement flow with conversation history
- Email verification flow with pending/verified status from `profiles.verification_status`

## Project Structure

- `app/` - routes and API handlers
- `features/` - feature-level pages, hooks, components
- `components/ui/` - shared reusable UI primitives
- `lib/` - data access, clients, server utilities
- `supabase/` - SQL schema and feature SQL files
- `scripts/` - one-off scripts (e.g. RAG ingest)

## Prerequisites

- Node.js `18+`
- npm
- A Supabase project
- API keys/credentials for OpenAI, API.Bible, and SMTP

## Environment Variables

Create `.env.local` in the repo root:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=

OPENAI_API_KEY=
# optional fallback used in code:
# OPENAI_SK=

API_BIBLE_KEY=
API_BIBLE_BASE_URL=https://api.scripture.api.bible
API_BIBLE_ID_NIV=
API_BIBLE_ID_NLT=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

## Getting Started

```bash
npm install
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build + typecheck
- `npm run start` - run production server
- `npm run lint` - run ESLint
- `npm run rag:ingest` - ingest Bible/knowledge data for RAG

## Database Notes

This project includes SQL files in `supabase/` (e.g. `schema.sql`, `favorites.sql`, `bible-annotations.sql`, `verification.sql`, `chat.sql`, `rag.sql`).

Apply them to your Supabase project before running features that depend on those tables/policies.

## Deployment

Deploy on Vercel (recommended) or any Node-compatible host.

- Set the same environment variables in your deployment provider
- Ensure `NEXT_PUBLIC_SITE_URL` matches your deployed domain
- Verify Supabase redirect URLs include your auth callback endpoints