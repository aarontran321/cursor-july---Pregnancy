# PRD: Wedding Vendor Clipping & Board Tool (MVP)

## 1. Problem

Couples planning a wedding collect vendor options (photographers, venues, flights) across a dozen open tabs — Airbnb listings, photographer portfolios, flight search results — with no single place to save, compare, and rank them. Existing tools (Pinterest, spreadsheets, bookmarks) don't capture price or let you triage fast.

## 2. Goals (MVP)

- One click on any vendor page → title, image, price captured and saved.
- A dashboard that shows everything captured, lets the couple swipe through an inbox to shortlist/reject, and organizes shortlisted items into a ranked board by category.
- Zero AI dependency for extraction — heuristic/DOM-based only.
- Single couple, single board, no login.

## 3. Non-Goals (explicitly out of scope for this build)

- CRM / vendor contact management
- Automated email outreach
- iMessage plugin
- Voice agent for calls
- Screenshot + OCR / vision-based classification (noted as a **future fallback**, not built now)
- Multi-user auth, multi-board support
- AI-generated theme/aesthetic matching

These are named in the architecture below only so the schema doesn't have to be redesigned later — none of them get built in this pass.

## 4. Users & Tenancy

- Single couple, single implicit board. No login screen, no user table.
- One `wedding_config` row holds the couple's inputs: theme prompt, date, budget.
- Everything else (`clips`) belongs to that one board implicitly.

## 5. Core User Flow

1. **Onboarding (one-time):** couple opens the dashboard, fills one screen — theme/aesthetic prompt (free text), wedding date, budget. Saved to `wedding_config`.
2. **Clipping:** couple browses vendor sites (Airbnb, photographer portfolios, airline search). On any page, click the extension icon. Extension scrapes the page, shows a small preview popup (image, title, price, category dropdown — auto-guessed, editable), couple confirms → saved to DB with status `inbox`.
3. **Triage:** dashboard's **Inbox** tab shows unswiped clips as a swipe deck. Swipe right = shortlist, left = reject. Tap = expand detail/edit price/category/notes before deciding.
4. **Board:** shortlisted clips land in the **Board** tab, a Pinterest-style masonry grid grouped into category columns/tabs (Photographer / Location / Flights / Other). Drag-to-reorder within a category sets rank (top = most preferred).
5. Rejected clips are archived (soft-deleted, recoverable from a "Rejected" filter, not surfaced by default).

## 6. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Extension | Chrome Manifest V3 (content script + popup) | Standard, no server round-trip needed to scrape |
| Backend/DB | Supabase (Postgres + Storage) | Zero-auth-now but auth/multi-tenant later is a flip of a flag; built-in image storage for cached thumbnails; instant REST via PostgREST means no custom backend needed for MVP |
| Dashboard | Next.js + Tailwind, hosted on Vercel | Fast to ship, matches extension's fetch-based API calls |
| Swipe UI | `react-tinder-card` or Framer Motion drag gestures | Purpose-built for this exact interaction |
| Board reorder | `dnd-kit` | Lightweight drag-and-drop for masonry reorder |
| Masonry layout | CSS columns or `react-masonry-css` | No need for anything heavier at this scale |

No AI/LLM calls anywhere in this build. No vision APIs. Category guessing is a keyword/domain heuristic (see §8).

## 7. Data Model

```sql
wedding_config (
  id            uuid primary key default gen_random_uuid(),
  theme_prompt  text,
  wedding_date  date,
  budget        numeric,
  updated_at    timestamptz default now()
)
-- single row, upserted

clips (
  id            uuid primary key default gen_random_uuid(),
  source_url    text not null,
  source_domain text,
  title         text,
  image_url     text,
  price_raw     text,           -- e.g. "$2,400/night" as scraped
  price_value   numeric,        -- parsed numeric, nullable if unparseable
  category      text,           -- 'photographer' | 'location' | 'flights' | 'other'
  status        text default 'inbox',  -- 'inbox' | 'shortlisted' | 'rejected'
  rank          integer,        -- position within category, null until shortlisted
  notes         text,
  created_at    timestamptz default now()
)
```

## 8. Browser Extension Spec

**Trigger:** toolbar icon click on any page.

**Scrape logic (in priority order, no AI):**
- `title`: `og:title` meta tag → fallback `document.title`
- `image`: `og:image` meta tag → fallback largest visible `<img>` on page by rendered area
- `price`: check JSON-LD `Product`/`Offer` schema first (`priceCurrency`/`price`) → fallback regex scan of visible text for currency patterns (`$X,XXX`, `$X,XXX/night`, `CAD $X,XXX`) → take first match near the top of the page
- `category` (auto-guess, user can override in popup):
  - domain contains `airbnb`, `vrbo`, `booking` → `location`
  - domain/page text contains `photography`, `photographer`, `studio` → `photographer`
  - domain contains airline names or flight-search patterns (`expedia`, `kayak`, `google.com/flights`) → `flights`
  - else → `other`

**Popup UI:** preview card (image, title, price, category dropdown, optional note field) + **Save** button → `POST /api/clips`. No page reload, toast confirmation on success.

**Storage:** extension stores the Supabase API URL/key locally (single-user config), no auth flow.

## 9. Dashboard UI Spec

**Nav:** `Inbox` | `Board` | ~~CRM~~ *(greyed out, "coming soon")*

**Onboarding screen** (shown once, editable later from a settings gear):
- Theme/aesthetic prompt (single text input)
- Date picker
- Budget input

**Inbox (swipe view):**
- Full-screen card stack, one clip at a time
- Swipe right → shortlist, swipe left → reject, tap → expand (edit category/price/notes inline)
- Empty state: "You're all caught up" once inbox is empty

**Board (masonry + rank view):**
- Tabs: Photographer / Location / Flights / Other
- Pinterest-style masonry grid within each tab
- Drag-and-drop reorder sets `rank`
- Card shows image, title, price, small "source" link back to original page, remove (→ rejected) button
- Running budget indicator per category if `price_value` is present (sum of shortlisted items vs. `budget`)

## 10. API Endpoints (Supabase PostgREST + a couple of light Next.js API routes)

- `POST /api/clips` — create (called by extension)
- `GET /api/clips?status=inbox` — inbox queue
- `GET /api/clips?status=shortlisted&category=X` — board view per category
- `PATCH /api/clips/:id` — update status, rank, category, price, notes
- `GET /api/config` / `PATCH /api/config` — onboarding data

## 11. Build Order / Milestones

- **M0** — Supabase schema live, Next.js skeleton, onboarding screen wired to `wedding_config`
- **M1** — Extension: scrape + popup + save to DB (this is the riskiest/most fiddly part — price regex and image fallback will need real-world tuning against actual Airbnb/photographer sites)
- **M2** — Inbox swipe view wired to real data
- **M3** — Board masonry view + drag-to-reorder ranking
- **M4 (stretch, still no AI)** — CSV export of shortlisted board, budget-vs-actual summary

## 12. Explicitly Deferred (Phase 2+)

- OCR/vision fallback for pages where DOM scraping fails (paywalled previews, canvas-rendered listings)
- CRM: vendor contact records, quote request tracking
- Automated email outreach (templated, triggered from board)
- iMessage plugin for text-based vendor outreach
- Voice agent for calling vendors
- Multi-user auth (both partners logging in separately, shared board permissions)