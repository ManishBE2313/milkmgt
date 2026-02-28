# Milk Manager Plus

Milk Manager Plus is a full-stack milk delivery management system with customer tracking, delivery calendar, monthly summaries, analytics, billing, and data import/export.

## Tech Stack

- Frontend: Next.js 14, TypeScript, Tailwind CSS, Zustand, Axios, Recharts, jsPDF
- Backend: Node.js, Express, TypeScript, PostgreSQL, `pg`, Sequelize
- Deployment: Render (server), Vercel-compatible frontend

## Repository Structure

```text
milkmgt/
  client/   # Next.js frontend
  server/   # Express API + PostgreSQL
```

## Core Features

- User profile bootstrap (username/fullname/address)
- Customer management (CRUD + per-customer rate)
- Delivery entry by date (delivered, absent, mixed, no_entry)
- Monthly summary (litres, delivered days, absent days, bill)
- Analytics and trends
- Bill generation + PDF invoice
- Export JSON/CSV and import JSON backup
- Auto-login via cached credentials (frontend localStorage)

## Local Setup

## 1) Prerequisites

- Node.js 18+
- npm
- PostgreSQL 13+

## 2) Server Setup

Path: `server/`

1. Install dependencies:
   - `npm install`
2. Create environment variables (`.env`):
   - `PORT=5000`
   - `NODE_ENV=development`
   - `DB_HOST=localhost`
   - `DB_PORT=5432`
   - `DB_NAME=milkmgt`
   - `DB_USER=postgres`
   - `DB_PASSWORD=your_password`
   - `CLIENT_URL=http://localhost:3000`
3. Start server:
   - `npm run dev`

API base URL: `http://localhost:5000/api`

## 3) Client Setup

Path: `client/`

1. Install dependencies:
   - `npm install`
2. Create environment variables (`.env.local`):
   - `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
3. Start client:
   - `npm run dev`

App URL: `http://localhost:3000`

## API Routes

Base prefix: `/api`

- User
  - `POST /user` create or fetch existing user
  - `GET /user/:username` fetch user profile
- Customers
  - `GET /customers/:username`
  - `POST /customers/:username`
  - `PUT /customers/:username/:customerId`
  - `DELETE /customers/:username/:customerId`
  - `GET /customers/:username/:customerId/history?month_year=YYYY-MM`
- Deliveries
  - `GET /deliveries/:username?month_year=YYYY-MM`
  - `POST /deliveries/:username` create or update by date
  - `DELETE /deliveries/:username/:date`
- Summary/Report
  - `GET /summary/:username/:month`
  - `PUT /summary/:username/:month/rate`
  - `GET /report/:username`
- Export/Import
  - `GET /export/:username/json`
  - `GET /export/:username/csv`
  - `POST /import/:username`
- Billing
  - `GET /bill/:username?customer_id=...&period_start=YYYY-MM-DD&period_end=YYYY-MM-DD`

## Database Model

## `users`

- `id` (PK)
- `username` (unique)
- `fullname`
- `address`
- `created_at`

## `customers`

- `id` (PK)
- `user_id` (FK -> users.id)
- `name` (unique per user)
- `address`
- `contact`
- `rate_per_litre`
- `created_at`, `updated_at`

## `deliveries`

- `id` (PK)
- `user_id` (FK -> users.id)
- `customer_id` (FK -> customers.id, nullable)
- `delivery_date`
- `quantity`
- `status` (`delivered | absent | mixed | no_entry`)
- `month_year` (`YYYY-MM`)
- `rate_per_litre` (nullable override)
- `created_at`, `updated_at`
- unique constraint: `(user_id, delivery_date)`

## Frontend Architecture

- App Router pages under `client/src/app`
- Global state with Zustand: `client/src/store/useStore.ts`
- API wrappers: `client/src/lib/api.ts`
- Auth cache helper: `client/src/lib/authCache.ts`
- Shared components in `client/src/components`

## UI System (Current Design)

The frontend now uses a unified professional glass/neumorphic style:

- Global design tokens in `client/src/app/globals.css`
- Soft gradient background + blur glow layers
- Glass cards, rounded controls, consistent spacing
- Standardized buttons/inputs/tables via utility classes
- Reduced emoji-heavy labels in core navigation and cards

## Important Notes

- Backend currently mixes raw SQL (`pg`) and Sequelize model sync.
- `sequelize.sync({ alter: true })` is enabled in server startup.
- Delivery creation/update is date-based per user (not multiple entries per day).
- CORS uses `CLIENT_URL` plus localhost and vercel wildcard pattern.

## Build Commands

### Client

- `npm run dev`
- `npm run build`
- `npm run start`

### Server

- `npm run dev`
- `npm run build`
- `npm run start`

## Deployment

- Server has Render config: `server/render.yaml`
- Set database and CORS environment variables in your deployment platform
- Frontend needs `NEXT_PUBLIC_API_URL` to point to the deployed backend

