# 🧭 Driftway

**A collaborative trip planner that turns group chats into itineraries.** Planning time cut in half.

Group trips die in the group chat: 400 messages, zero decisions. Driftway keeps the chat — and quietly turns it into a plan. Every message is scanned for actionable suggestions ("let's try Ramiro at 1:30pm"), which become draggable cards you can drop straight onto a day, or put to a one-tap vote.

## Features

- **Chat → itinerary engine** — messages are parsed in real time for places, activities, and times; detected suggestions get a card with *Add to day* and *Put to a vote* actions, and can be **dragged directly onto any day** of the board.
- **Drag-and-drop itinerary** — reorder stops within a day or move them across days, with live drop indicators. Every stop carries a time, category color, note, author, and crew votes.
- **Smart quick-add** — type `Dinner at Ramiro 8pm` under any day and Driftway extracts the title, time, and category automatically.
- **Polls** — settle arguments with one-tap voting, live percentage bars, voter avatars, and a *Send winner to itinerary* button.
- **Shared budget** — log expenses, split them between any subset of the crew, and see per-person balances and a spend-by-category breakdown, in the trip's own currency.
- **Packing list** — shared checklist with progress and one-tap assignment (tap the avatar slot to hand an item to someone).
- **Command palette** — `⌘K` / `Ctrl+K` for instant navigation, quick actions, trip switching, and theme toggling.
- **Live crew presence** — online indicators, typing indicators, and simulated teammates who reply and vote, so the collaborative loop is tangible in the demo.
- **Multiple trips** — each with its own cover identity, crew, currency, and dates; create new ones in seconds.
- **Markdown export** — download the full itinerary as a clean `.md` file to share anywhere.
- **Two moods** — *Daybreak* (warm parchment) and *Overnight* (deep ink) themes, persisted along with all trip data in `localStorage`.

## Design

Driftway deliberately avoids default app chrome. The design system is hand-built: an editorial travel-journal aesthetic with warm paper tones, a Fraunces serif display voice, terracotta/teal/gold accents, dotted route lines, paper grain, ticket-like stop cards, and motion tuned for calm (`prefers-reduced-motion` respected).

## Stack

- React 18 + TypeScript + Vite
- Zero UI libraries — custom design system in plain CSS (~1,300 lines of tokens, components, and themes)
- State: single reducer + React context, persisted to `localStorage`

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build
npm run preview  # serve the production build
```

The app ships with two seeded demo trips (Lisbon and Kyoto). Use the command palette → *Reset demo data* to restore them at any time.
