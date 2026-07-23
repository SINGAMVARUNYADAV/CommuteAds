# CommuteAds

A transit advertising platform (DOOH) for Hyderabad, India. Brands can book, manage, and track digital ad campaigns displayed on interactive tablet screens inside cabs (Uber, Ola, corporate fleet, airport transfers).

## Architecture

Pure static HTML/CSS/JS site — no build step required. Five pages + one asset served directly.

| File | Purpose |
|---|---|
| `index.html` | Public landing page (hero, how-it-works, pricing, testimonials, FAQ) |
| `advertise.html` | Pre-book / lead capture form → Supabase `prebooks` table |
| `contact.html` | General contact form → Web3Forms email |
| `login.html` | Supabase Auth sign-in / sign-up / forgot-password |
| `dashboard.html` | Advertiser workspace (campaigns, performance, billing, invoices) |
| `admin.html` | Admin command center (campaign approvals, lead pipeline) |

## Tech Stack

- **Styling**: Tailwind CSS (CDN)
- **Database**: Supabase (PostgreSQL via anon key + RLS)
- **Auth**: Supabase Auth (email + password, real sessions)
- **Email**: Web3Forms API
- **File Storage**: Supabase Storage (`campaign-videos` bucket)
- **Animations**: AOS.js

## Running

The app is served with Python's built-in HTTP server on port 5000:

```
python3 -m http.server 5000
```

No dependencies to install.

## Supabase Tables

| Table | Purpose |
|---|---|
| `campaigns` | Advertiser campaign records (status: Pending Review / Live / Paused) |
| `prebooks` | Lead pipeline from advertise.html form |

## Auth & Security

- Supabase anon key is public by design — all security enforced by Row Level Security (RLS) policies on Supabase
- Admin is identified by email: `admin@commuteads.com`
- All pages with protected content check `supabaseClient.auth.getSession()` and redirect to `login.html` if unauthenticated
- All user-generated HTML is escaped via `escHtml()` to prevent XSS

## User Preferences

- Keep the existing static HTML architecture — no framework migration
- Dark mode default, with light mode toggle (persisted via `localStorage`)
- Brand accent color: `#3b82f6` (blue-500) on public pages, `#8b5cf6` (purple-500) on admin
