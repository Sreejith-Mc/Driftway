# 🧭 Driftway

**A collaborative trip planner that turns group chats into itineraries.** Planning time cut in half.

Group trips die in the group chat: 400 messages, zero decisions. Driftway keeps the chat — and quietly turns it into a plan. Every message is scanned for actionable suggestions ("let's try Ramiro at 1:30pm"), which become draggable cards you can drop straight onto a day, or put to a one-tap vote. Invite your crew with a link and everyone edits the same trip **live**.

## Features

- **Real accounts & live collaboration** — sign up, invite your crew by link, and everyone edits the same trip in real time. Chat, itinerary, polls, budget, and packing all sync instantly across people.
- **Chat → itinerary engine** — messages are parsed for places, activities, and times; detected suggestions get a card with *Add to day* and *Put to a vote* actions, and can be **dragged directly onto any day**.
- **Drag-and-drop itinerary** — reorder stops within a day or move them across days. Each stop carries a time, category color, note, author, and crew votes.
- **Smart quick-add** — type `Dinner at Ramiro 8pm` under any day and Driftway extracts the title, time, and category automatically.
- **Polls** — one-tap voting, live results, voter avatars, and a *Send winner to itinerary* button.
- **Shared budget** — log expenses, split them between any subset of the crew, and see per-person balances plus a spend-by-category breakdown.
- **Packing list** — shared checklist with progress and one-tap assignment.
- **Live presence & typing** — real online indicators and typing bubbles for the people actually in the trip.
- **Command palette** (`⌘K` / `Ctrl+K`), Markdown itinerary export, multi-trip support, and **Daybreak / Overnight** themes.

## Design

A bold two-tone identity — deep **Cyprus green** (`#004741`) on warm **Sand** (`#F0EDE4`) — with **Bricolage Grotesque** display type and **Schibsted Grotesk** for UI. Fully responsive (sidebar and chat become drawers on mobile) with an orchestrated motion layer that respects `prefers-reduced-motion`.

## Stack

- **Frontend:** React 18 + TypeScript + Vite, custom design system in plain CSS (no UI kit)
- **Backend:** [Convex](https://convex.dev) — database + reactive queries (real-time) + **Convex Auth** (email/password). One service, never pauses on inactivity.

---

## Run it locally

You need Node 18+ and a free Convex account (created during step 2).

```bash
# 1. Install dependencies
npm install

# 2. Start Convex — creates your project + deployment, generates convex/_generated,
#    and writes CONVEX_DEPLOYMENT + VITE_CONVEX_URL into .env.local.
#    Leave this running in its own terminal.
npx convex dev

# 3. One-time: set up auth keys (JWT keypair + SITE_URL) on your deployment.
npx @convex-dev/auth

# 4. In a second terminal, start the app
npm run dev
```

Open http://localhost:5173, create an account, and you'll land in a seeded starter trip. Open a second browser (or an incognito window), sign up as a different person, and use the **Invite** button's link to join the same trip — you'll see edits sync live between the two.

## Deploy to Vercel

Driftway ships a `vercel.json` that builds the Convex backend and the frontend together, so deployment is:

1. **Push this repo to GitHub** and import it at [vercel.com → Add New → Project](https://vercel.com/new). It auto-detects Vite.
2. **Create a production deploy key:** in the [Convex dashboard](https://dashboard.convex.dev) → your project → **Production** → **Deploy key**. Copy it.
3. In Vercel → your project → **Settings → Environment Variables**, add:
   - `CONVEX_DEPLOY_KEY` = the production deploy key from step 2
4. **One-time**, point Convex Auth at your production deployment:
   ```bash
   npx @convex-dev/auth --prod
   ```
5. Hit **Deploy**. The build command (`npx convex deploy --cmd 'npm run build'`) pushes your functions to the production Convex deployment and injects `VITE_CONVEX_URL` automatically — no other env vars needed.

Every push to your production branch redeploys both the backend and the frontend.

### Notes

- `convex/_generated` and `.env.local` are git-ignored — they are created by `npx convex dev` (locally) and by the Vercel build (in CI). Don't commit them.
- Auth is email + password by default. To add Google/GitHub sign-in later, add an OAuth provider in `convex/auth.ts` — the rest of the app doesn't change.
