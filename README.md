# CASIGURO Enterprise Transaction Management System — UI Prototype

Frontend-only UI prototype built with **React + TypeScript + Tailwind CSS (Vite)**.
No backend, database, or real authentication — all data is local mock state, structured
so it can be swapped for real API/DB calls without a UI redesign.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`). Sign in with any
text in the login form — it's a prototype, so there's no real auth check yet.

```bash
npm run build     # type-checks and builds a production bundle to /dist
npm run preview   # preview the production build locally
```

## Project structure

```
src/
  components/
    ui/          Reusable primitives: Button, Card, Badge, Modal, Field, Avatar,
                  EmptyState, Toast, SectionHeading
    layout/      AppShell (sidebar + header), Sidebar, Logo
    orders/      MiniCalendar, DeadlinePanel, NewOrderModal, UpdateOrderModal
  pages/         One file per route: Login, Dashboard, Order Management,
                  Production Monitoring, Completed Transactions, Statistics,
                  Notifications
  data/
    mockData.ts  Mock orders + notifications — the seam to replace with real
                  API/DB calls later
  lib/
    constants.ts Design tokens, nav items, status configs, categories
    utils.ts     Formatting + date helpers (currency, dates, relative time, cn)
  types/
    index.ts     Order, AppNotification, and form/payload interfaces
  App.tsx        Top-level state (auth, active page, orders, notifications) and
                  the two mutator functions (handleCreateOrder, handleUpdateOrder)
                  that own all business logic for creating/updating orders
  main.tsx       React entry point
  index.css      Tailwind directives + base styling
```

## Wiring up real data later

Everything reads from two pieces of state in `App.tsx`: `orders` and `notifications`.
To connect a real backend:

1. Replace the `useState(MOCK_ORDERS)` / `useState(MOCK_NOTIFICATIONS)` initial values
   with data fetched from your API (e.g. in a `useEffect`, or a data-fetching library
   of your choice).
2. Replace the bodies of `handleCreateOrder` and `handleUpdateOrder` in `App.tsx` with
   API calls (e.g. `POST /orders`, `PATCH /orders/:id`), keeping the same function
   signatures so no page or component needs to change.
3. Swap the hardcoded `NOW` constant in `src/lib/constants.ts` for `new Date()` once
   you're no longer anchoring to the prototype's fixed "today" mock date.

## Design system

Colors, typography, spacing, and component styling are derived from the CASIGURO
Enterprises login screen: pink/fuchsia/sky gradient accents, rounded-2xl/3xl cards,
Poppins for display headings, Inter for body text.
