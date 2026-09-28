# RentEazy

Find a room, not a runaround. A room-rental listing app for Soweto — search,
filter, view listings with photos, and list your own room.

This is the "build it properly" version: a real Next.js app backed by
Supabase (Postgres + file storage), replacing the Claude artifact prototype.
It's an MVP — see "What's intentionally missing" below before you show it
to anyone outside your own testing.

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind)
- **Supabase** — Postgres database, storage for photos, no auth yet
- Same design tokens (colors, type) as the original prototype

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a free project, then:

1. Open the SQL Editor and run everything in `supabase/schema.sql`. This
   creates the `listings` and `listing_photos` tables, sets up permissive
   row-level-security policies for the MVP, creates the `listing-photos`
   storage bucket, and seeds three sample listings.
2. Go to **Project Settings → API** and copy your **Project URL** and
   **anon public key**.

### 2. Configure the app

```bash
cp .env.local.example .env.local
```

Paste your Project URL and anon key into `.env.local`.

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Push to GitHub

```bash
git init
git add .
git commit -m "RentEazy: Next.js + Supabase MVP"
git remote add origin <your-repo-url>
git push -u origin main
```

### 5. Deploy

The easiest path is [Vercel](https://vercel.com) (built by the Next.js
team, free tier is enough for this): import the GitHub repo, add the two
environment variables from `.env.local` in the Vercel project settings,
deploy. Every push to `main` redeploys automatically.

## What's here

- `app/page.tsx` — browse & filter listings (area, budget, room type,
  verified-only)
- `app/listings/[id]/page.tsx` — listing detail with a swipeable photo
  gallery and WhatsApp/call contact links
- `app/list-a-room/page.tsx` — submit a new listing with photos, uploaded
  straight to Supabase Storage
- `supabase/schema.sql` — the whole database schema in one file

## What's intentionally missing (MVP scope)

- **No verification.** New listings save as `verified: false` and there's
  no check on who's submitting. You paused this deliberately — worth
  revisiting once real listings start coming from strangers, not just you.
- **No auth.** Anyone with the URL can add a listing. Fine for testing with
  people you trust; not fine for a public launch — the `insert` policies in
  `schema.sql` are flagged with a comment where this needs tightening.
- **No listing editing or removal.** Once a room is rented, there's
  currently no way to take it down. Worth adding before real usage, even a
  simple "mark as taken" button.
- **No moderation queue.** Every submission goes live immediately.

None of this is hard to add later — the data model already has a
`verified` boolean waiting to be used by whatever verification flow you
build next.
