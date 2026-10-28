# Casiguro Transaction Management System — Frontend

Web app for Casiguro Enterprises, a Philippine printing / products-and-services business. It covers the whole flow:
catalog → quotation → order → production → payments → completed transaction, with live updates between users.

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Recharts · React Router · Socket.IO client

It needs the API from the separate [`backend`](../backend) repository.

## Requirements

- **Node.js 20+** (developed on Node 24)
- The **backend running**, with its database set up (`npm run db:setup`) and an admin created (`npm run create-admin`).
  See the backend README.

## Setup

```bash
npm install
cp .env.sample .env     # optional locally: without it the app uses http://localhost:5000
npm run dev             # http://localhost:5173
```

Sign in with the admin account made by `npm run create-admin`. New staff use **Register**: they verify their email
with a code, then wait for an admin to approve them under **Accounts & Audit**.

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload (port 5173) |
| `npm run build` | Type-checks and builds the production bundle into `dist/` |
| `npm run preview` | Serves the built `dist/` locally |
| `npx tsc -b` | Type-check only |

### Environment variables

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL, with no trailing slash. Defaults to `http://localhost:5000`. API calls and the live-update socket both use it. |

Vite bakes `VITE_*` values in at **build time**. After changing one, restart `npm run dev` or rebuild.

## Features

| Area | Who | What |
|---|---|---|
| Dashboard | Admin | Active orders, deadlines, payments collected this month |
| Order Management | All | Quotations (draft → sent → accepted/rejected, PDF export) and direct orders, with an optional down payment |
| Production Monitoring | All | Per-item progress ("add finished pcs"), status, payments and reference documents |
| Completed Transactions | All | Finished and cancelled orders. SOA / PR / PO / J.O. / SI-OR / DR numbers |
| Customer Overview | All | Customers, their orders and payments |
| Product & Service Catalog | Admin | Items, priced options, categories, images |
| Statistics | Admin | Sales charts and the **Export to Excel** sales sheet |
| Notifications | All | Activity feed, read state per user |
| Accounts & Audit | Admin | Approve, reject, deactivate or promote accounts. Per-account activity log with CSV export |

## Project structure

```
src/
  pages/            One file per screen (Dashboard, OrderManagement, ProductionMonitoring, CompletedTransactions,
                    CustomerOverview, ProductServiceCatalog, Statistics, Notifications, Accounts, AccountDetail,
                    Login, Register)
  components/
    accounts/       Account actions, audit log table, promote-admin flow
    catalog/        Catalog grid/picker and shopping cart used by orders and quotations
    orders/         New/Update order modals, payments, reference documents, production quantity input
    quotations/     New quotation modal, items table, details + PDF
    layout/         App shell, sidebar, logo
    ui/             Shared primitives (Button, Modal, Field, PriceInput, …)
  utils/
    RestAPI.ts      BASE_URL (from VITE_API_URL) and apiRequest, the fetch wrapper (cookies, errors, 401 sign-out)
    *API.ts         One API module per backend area (orders, quotations, catalog, accounts, reports, …)
    socket.ts       Socket.IO connection and event subscriptions
  context/          Signed-in user (AuthProvider)
  routes/           Route guards (signed in, admin only)
  types/            Shared TypeScript types
  lib/              Constants and helpers (currency, dates, cn)
  App.tsx           Routes, plus the shared orders/notifications state kept live over the socket
```

## Deploying (Vercel)

1. Import this repo in Vercel. The framework preset **Vite** builds with `npm run build` into `dist`.
2. Under **Settings → Environment Variables**, set `VITE_API_URL` to the deployed backend URL, e.g.
   `https://casiguro-api.ondigitalocean.app`.
3. On the backend, set `CLIENT_ORIGIN` to the Vercel URL so CORS and live updates accept it.
4. Add a rewrite of all paths to `/index.html` (a `vercel.json`), so refreshing a page like `/orders` doesn't return 404.

> The backend also needs a few production changes (cross-site login cookie, hosted-DB settings). See the backend
> README's **Deploying** section.

## Design system

Colors, typography, spacing and component styling come from the CASIGURO Enterprises login screen: pink, fuchsia and
sky gradient accents, rounded-2xl/3xl cards, Poppins for display headings and Inter for body text.
