# DuoLog 📒

A lightweight, zero-bloat, mobile-first **Progressive Web App** for two open-source co-maintainers to track their shared virtual ledger.

Built with: **Vite + React + TypeScript + Tailwind CSS + Neon Postgres**

---

## Setup

### 1. Neon — Run the Schema

1. Open your Neon project → **SQL Editor**
2. Paste the contents of `neon/schema.sql` and click **Run**

This creates the `contributors` and `transactions` tables and their required index.

### 2. Configure the connection string

Copy your Neon pooled connection string. It is used only by Vercel API functions and must never be exposed to the browser.

### 3. Create Your `.env`

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
```
DATABASE_URL=postgresql://...
```

### 4. Run Locally

```bash
bun install   # or npm install
npx vercel dev
```

`vercel dev` runs both the Vite site and the local `/api` functions. Add `DATABASE_URL` to `.env.local` for local development.

---

## Deploying to Vercel (Free)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. In **Environment Variables**, add:
   - `DATABASE_URL` → your Neon pooled connection string
4. Click **Deploy**

That's it. Share the Vercel URL with your co-maintainer. The URL is your shared access.

> **Security note**: There is no login. Anyone with the URL can view and edit the ledger. Keep the URL private between your team.

---

## Features

- Shared balance — refreshes across devices every 15 seconds
- Add Funds — log income
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
| transactions | id, type, amount, contributor_id, description, date |
