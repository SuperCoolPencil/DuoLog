# DuoLog 📒

A lightweight, zero-bloat, mobile-first **Progressive Web App** for two open-source co-maintainers to track their shared virtual ledger in real-time.

Built with: **Vite + React + TypeScript + Tailwind CSS + Supabase**

---

## Setup

### 1. Supabase — Run the Schema

1. Go to your Supabase project → **SQL Editor** → **New Query**
2. Paste the entire contents of `supabase/schema.sql` and click **Run**

This creates the `contributors`, `categories`, and `transactions` tables, sets up permissive RLS policies for anonymous access, and enables real-time replication.

### 2. Get Your Supabase Credentials

In your Supabase dashboard → **Project Settings** → **API**:
- Copy **Project URL**
- Copy **anon / public** key

### 3. Create Your `.env`

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Run Locally

```bash
bun install   # or npm install
bun dev       # or npm run dev
```

---

## Deploying to Vercel (Free)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` → your project URL
   - `VITE_SUPABASE_ANON_KEY` → your anon key
4. Click **Deploy**

That's it. Share the Vercel URL with your co-maintainer. The URL is your shared access.

> **Security note**: There is no login. Anyone with the URL can view and edit the ledger. Keep the URL private between your team.

---

## Features

- Real-time balance — updates instantly on both devices via Supabase channels
- Add Funds — log income with custom categories
- Withdraw — log expenses, assign who paid
- Settings — manage contributor names and categories (all editable/deletable)
- Delete transactions — inline confirm before delete
- PWA — installable to your phone home screen via "Add to Home Screen"
- INR — all amounts formatted for Indian Rupees

---

## Database Schema

| Table | Columns |
|-------|---------|
| contributors | id, name |
| categories | id, name, type (INCOME/EXPENSE) |
| transactions | id, type, amount, category_id, contributor_id, description, date |
