<div align="center">

# 💍 Marrymap

### A wedding planner for couples doing it themselves.

Swipe on vendors together, keep every quote in one place, and clip options straight from the web.

<br/>

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Chrome Extension](https://img.shields.io/badge/Chrome_MV3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

</div>

---

## The problem

Skipping the wedding planner saves the ~$5,000 it would cost — and creates a second job: roughly **200 decisions across six months**. Which photographer earns the price. When invitations go out. Whether a florist's quote is fair or the budget is about to break. Couples end up juggling a dozen browser tabs, group texts, and a spreadsheet that never quite keeps up.

**Marrymap turns that chaos into one shared, opinionated workspace.**

## What it does

Marrymap is a monorepo with three parts that work together:

### 🖤 The dashboard — *decide together*
The couple's home base. Every category (catering, DJ, photographer, venue, florist, cake) is an **album**. Open one and you **Tinder-swipe** through the options as a couple — an option only becomes a **match** when *both* partners swipe right.

- **Swipe to decide** — draggable card deck with live like/pass feedback and per-partner indicators
- **Matches** surface automatically when you both say yes
- **Guests can contribute** — friends and family recommend vendors (right from the browser extension) that drop straight into the right album for the couple to swipe on
- **Invite flow** — one click copies a shareable invite link; notifications show who's joined the board
- **Vendor contact drawer** — open any vendor to see the full email thread (quote requests, wedding details, deposits) in a clean side panel
- **Light / dark theme**, persisted locally

### 📇 The Vendor CRM — *never lose a quote*
An in-dashboard CRM tab that tracks every vendor through a real pipeline: **Lead → Contacted → Quoted → Booked** (with a *Declined* off-ramp). Each vendor carries quote and deposit amounts, due dates, a communication log (calls, emails, meetings, notes), and **CSV export** for the whole shortlist.

### 🧩 The browser extension — *anyone can recommend a vendor*
A **Chrome Manifest V3** extension ("Vendor Clipper") that lets **anyone — the couple *or* their guests** — recommend a vendor straight from the web. See a florist on Instagram, a photographer's portfolio, a caterer's site? One click captures the title, category, image (`og:image`), a **full-page screenshot**, and contact info, and saves it to a **Supabase / Postgres** backend that feeds the couple's board.

No forms, no copy-pasting links into a group chat — a guest just **screenshots the page and it's clipped**. Every recommendation flows into the right album automatically, so the couple never has to hunt anything down. The result: the people who love you do the *finding*, and the couple only has to do the **swiping**.

> **Guests find. The couple swipes.** That's the whole loop — and it's why Marrymap turns 200 scattered decisions into an afternoon of swiping together.

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| **Web app** | Next.js 16 (App Router) · React 19 · TypeScript | Client dashboard, statically rendered, SSR-safe hydration |
| **Styling** | Tailwind v4 + hand-tuned CSS | Custom themed component system, light/dark |
| **Icons** | lucide-react | |
| **State (demo)** | `localStorage`, schema-shaped for a backend swap | Zero network — resilient, instant, demo-proof |
| **Extension** | Chrome Manifest V3 (content + background + popup) | One-click vendor capture |
| **Backend** | Supabase (Postgres) | `vendor_clips` schema with category constraints + indexes |

## Repo structure

```
.
├── wedding-planner/          # ▶ the main Next.js app
│   └── app/
│       ├── page.tsx          #   dashboard: albums, swipe, matches, invites, contact drawer
│       ├── crm/              #   Vendor CRM: pipeline, comms log, CSV export
│       ├── store.ts          #   domain model + seed data
│       └── marrymap.css      #   themed component styles
├── extension/                # Chrome MV3 "Vendor Clipper"
│   └── database/             #   Supabase schema.sql + seed.sql
├── supabase/                 # Supabase project config
└── PRD.md                    # product requirements
```

## Getting started

**Run the dashboard:**

```bash
cd wedding-planner
npm install
npm run dev
```

Open **http://localhost:3000**. It runs entirely on local state — no setup, no keys, no network required. Use the **↺ reset** button to restore the demo data at any time.

**Load the extension (optional):**

1. Go to `chrome://extensions` and enable **Developer mode**
2. Click **Load unpacked** and select the `extension/` folder
3. Provision the database with `extension/database/schema.sql` (then `seed.sql`) in your Supabase project

## Design decisions

- **Local-first dashboard.** All couple-facing state lives in `localStorage` but is shaped like the Postgres schema, so moving to Supabase is a data-layer swap, not a rewrite — and the live demo can never fail on venue Wi-Fi.
- **Auto-accept guest ideas.** Contributions from guests land directly in the albums (no approval queue) so the couple stays in one flow — swiping, not moderating.
- **One product, clear seams.** The CRM keeps its own self-contained domain types so it never couples to the clips feature, and the extension talks to the same schema the web app is designed around.

## Roadmap

- Live Supabase sync across devices (schema already in place)
- Real invite links + guest auth
- AI "judgment" — rank a shortlist and explain the pick
- Budget tracker that reacts as vendors get booked

<div align="center">
<br/>
<sub>Built at a hackathon. Marrymap — because two people planning this for the first time deserve better than a spreadsheet.</sub>
</div>
