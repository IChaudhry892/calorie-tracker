# Calorie Tracker

A mobile-friendly web app for tracking calories and protein. Work out your maintenance calories, keep a list of the foods you eat, build reusable diets, and log each day against your target.

**Live site: <https://calorie-tracker-chi-murex.vercel.app>**

## Features

- **Calorie calculator**: Mifflin–St Jeor BMR × activity level, with targets (and the daily surplus/deficit) for losing or gaining weight. Works in imperial or metric, and works without an account. Signed-in users can save their result as their maintenance calories.
- **Foods**: your own list of foods with serving size, calories and protein. Search it, edit or delete foods, or let **Gemini estimate** the macros for a food (50 estimates per user per day).
- **Diets**: named lists of foods and quantities with live totals. Duplicate them, or apply one to any day in one go.
- **Daily log**: one page per day (`/log?date=YYYY-MM-DD`) with a Sunday–Saturday week strip, entries from your foods or entered by hand, and a progress bar showing your surplus or deficit against maintenance.
- Email/password and Google sign-in. Every table uses Row Level Security, so users only ever see their own rows.
- [Privacy Policy](https://calorie-tracker-chi-murex.vercel.app/privacy) and [Terms of Service](https://calorie-tracker-chi-murex.vercel.app/terms) pages (needed to publish the Google sign-in app).

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript, Server Components and Server Actions)
- [Supabase](https://supabase.com) (Postgres, Auth, Row Level Security)
- [Tailwind CSS v4](https://tailwindcss.com) (a permanent dark theme)
- [Google Gemini](https://ai.google.dev) via `@google/genai` (structured JSON output, validated with `zod`)
- [Vitest](https://vitest.dev) for unit tests
- Hosted on [Vercel](https://vercel.com)

## Local setup

You need Node.js 20+ and a Supabase project.

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Copy `.env.example` to `.env.local` and fill it in:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   GEMINI_API_KEY=...   # free key from Google AI Studio; server-only, never prefix with NEXT_PUBLIC_
   ```
   The app runs without `GEMINI_API_KEY`: **Estimate with AI** just replies "AI estimates aren't set up."
3. Link your Supabase project and apply the migrations in `supabase/migrations`:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
4. In the Supabase dashboard → Authentication → URL Configuration, add `http://localhost:3000/**` to **Redirect URLs**. For Google sign-in, enable the Google provider and use the Supabase callback URL as the OAuth redirect.
5. Start the dev server:
   ```bash
   npm run dev
   ```
   Then open <http://localhost:3000>.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run db:types` | Regenerate `src/lib/database.types.ts` from the linked Supabase project |

## Testing on a phone (same Wi-Fi)

`next.config.ts` adds this machine's LAN IPv4 addresses to `allowedDevOrigins`, so a phone on the same network can open `http://<your-PC-IP>:3000` while `npm run dev` is running. Without it, Next blocks the dev scripts for non-localhost origins. The setting only applies in development.

Add `http://<your-PC-IP>:3000/**` to the Supabase Redirect URLs as well if you want to sign in from the phone. Email confirmation links have to be opened in the same browser that signed up.

## Deploying to Vercel

1. Push to GitHub and import the repository in Vercel (the framework is detected automatically).
2. Add the environment variables for Production and Preview: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `GEMINI_API_KEY`.
3. Deploy.
4. Use the **production domain** from Vercel → Settings → Domains (e.g. `https://<app>.vercel.app`), not a per-deployment URL. Per-deployment URLs sit behind Vercel's login (Deployment Protection), so other people can't open them.
5. In Supabase → Authentication → URL Configuration, set **Site URL** to the production domain and add `https://<app>.vercel.app/**` to **Redirect URLs**. Google's OAuth redirect stays the Supabase callback, so nothing changes there.
6. To let anyone sign in with Google, fill in Google Auth Platform → **Branding**: home page `/`, privacy policy `/privacy`, terms `/terms`, the production domain under authorized domains, and no logo (a logo triggers brand verification). Then go to **Audience → Publish app**.
