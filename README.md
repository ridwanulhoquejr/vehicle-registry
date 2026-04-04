# 🚗 Vehicle Registry

A vehicle registration system with PostgreSQL backend (Supabase).

- **Public view** — anyone can see all registered vehicles
- **Admin view** — add/remove vehicles with duplicate protection

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev
```

Opens at `http://localhost:5173`

## Database Setup (already done if you followed earlier steps)

Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE vehicles (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  reg_no TEXT NOT NULL UNIQUE,
  licence_no TEXT NOT NULL UNIQUE,
  address TEXT,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('Car', 'Bike', 'Micro Bus')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Admin insert" ON vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin delete" ON vehicles FOR DELETE USING (true);
```

## Deploy to Production

```bash
npm run build
```

Upload the `dist/` folder to Vercel, Netlify, or any static host (all free).

## Tech Stack

- React 18 + Vite
- Supabase PostgreSQL (free tier)
- No backend server needed — talks directly to Supabase REST API
