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
| `passenger_feedback` | Passenger ratings & comments from the QR-scan page |

### qr_scans schema
```sql
CREATE TABLE qr_scans (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_label   text        NOT NULL DEFAULT 'default',
  scanned_at timestamptz DEFAULT now()
);

ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a scan"
  ON qr_scans FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin reads scans"
  ON qr_scans FOR SELECT
  USING (auth.role() = 'authenticated');
```

### passenger_feedback schema
Create this table in your Supabase project (SQL editor):
```sql
CREATE TABLE passenger_feedback (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  star_rating integer     NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
  quick_tag   text,       -- loved | cartoons | news | ads | technical
  comment     text,
  email       text,
  created_at  timestamptz DEFAULT now()
);
-- Allow anonymous inserts (passengers don't log in)
ALTER TABLE passenger_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit feedback"
  ON passenger_feedback FOR INSERT WITH CHECK (true);
-- Only authenticated admin can read
CREATE POLICY "Admin reads feedback"
  ON passenger_feedback FOR SELECT
  USING (auth.role() = 'authenticated');
```

## Auth & Security

- Supabase anon key is public by design — all security enforced by Row Level Security (RLS) policies on Supabase
- Admin is identified by email: `admin@commuteads.com`
- All pages with protected content check `supabaseClient.auth.getSession()` and redirect to `login.html` if unauthenticated
- All user-generated HTML is escaped via `escHtml()` to prevent XSS

## User Preferences

- Keep the existing static HTML architecture — no framework migration
- Dark mode default, with light mode toggle (persisted via `localStorage`)
- Brand accent color: `#3b82f6` (blue-500) on public pages, `#8b5cf6` (purple-500) on admin
