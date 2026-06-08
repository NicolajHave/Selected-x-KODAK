# Selected × Kodak — Partner Booking Portal

An internal, embeddable web app for **Selected × Kodak** sales reps to register
wholesale partners for the 2027 activation program, and for HQ / Admin to review,
update, and export all bookings.

> _"Stories through the lens"_ — this is an **operational internal tool** with a
> premium brand layer, not a campaign landing page.

It is a self-contained, responsive **single-page app** designed to be dropped
into the existing Brand Platform via an `<iframe>` or mounted as a standalone
route. All styling is scoped to the app root, so nothing leaks into the host page.

---

## Features

**Sales Rep**
- Dashboard with KPIs (submitted, drafts, approved, awaiting review) and recent bookings
- 5-step new-booking wizard with progress indicator and inline validation
  1. Partner information
  2. Customer type (Key Account · Field Account · CBO / Digital Partner · Other)
  3. Activation selection (7 options, each with availability + cost owner)
  4. Activation details (conditional, per selected activation)
  5. Review & submit (with sticky summary on desktop)
- Save as draft or submit for HQ review, with a confirmation screen

**HQ / Admin**
- Filterable master overview (status, market, country, sales rep, customer type, activation, free-text search)
- Booking detail drawer with status changes and internal HQ notes
- One-click structured **Excel export** (`.xlsx`)

A demo **role switcher** (Sales Rep / HQ Admin) lives in the header — there is no
real authentication in this version.

---

## Tech stack

- **React 18 + TypeScript + Vite**
- **Scoped CSS** — all tokens and rules namespaced under `.sk-portal` (no global leakage)
- **Local state** via React hooks
- **localStorage** persistence behind a repository abstraction (no backend required)
- **[`xlsx`](https://www.npmjs.com/package/xlsx)** for Excel export
- No tracking scripts, no analytics

---

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:8080)
npm run build    # production build → dist/
npm run preview  # preview the production build locally
npm test         # run unit tests (validation + Excel mapping)
npm run typecheck # TypeScript type-check (no emit)
```

---

## Build

```bash
npm run build
```

Outputs a static bundle to `dist/`. The build uses a **relative base** (`base: "./"`
in `vite.config.ts`) and `BASE_URL`-aware asset paths, so the app works from any
subpath or inside an iframe without absolute `/` paths breaking.

---

## Embedding in the Brand Platform

The app is designed to be embedded with zero impact on the host page:

- **No global CSS** — every selector is scoped under `.sk-portal`; the app never
  styles `html`, `body`, or anything outside its own root.
- **Relative asset paths** — works under any subpath.
- **No full-page assumptions** — the app fills its container; size the iframe to taste.

### Option A — iframe

1. Run `npm run build`.
2. Host the `dist/` folder on your internal host.
3. Embed it:

```html
<iframe
  src="URL_TO_APP"
  width="100%"
  height="900"
  style="border:0;"
  title="Selected x Kodak Partner Booking Portal"
></iframe>
```

### Option B — mount inside an existing route

1. Host the contents of `dist/` (or publish the package to your internal registry).
2. Render `<App />` from `src/App.tsx` inside a container in your platform route.
3. Ensure `src/styles/tokens.css` and `src/styles/portal.css` are imported once.
   Both are fully scoped under `.sk-portal`, so they will not affect surrounding UI.

---

## Replacing localStorage with a real backend

Persistence is isolated behind a single seam so the UI never changes when you add
an API.

- **`src/data/repository.ts`** defines the `BookingRepository` interface and ships a
  `LocalStorageBookingRepository`. To go live, implement the same interface against
  your API and export it as `bookingRepository`.
- **`src/hooks/useBookings.ts`** is the only consumer of the repository. The methods
  (`list`, `get`, `upsert`, `remove`) are written to be trivially converted to
  `async`/`await` — make them return Promises and await them in the hook.
- The domain types in **`src/types/index.ts`** are storage-agnostic and map cleanly
  to a REST/GraphQL schema (one resource: `BookingSubmission`).

No component imports `localStorage` directly.

---

## Excel export

`src/utils/excel.ts` builds one worksheet — **one row per booking** — with the full
master-tracker column set, and downloads it as:

```
selected-kodak-booking-overview-YYYY-MM-DD.xlsx
```

`buildWorkbook()` is separated from the download so it can be unit-tested.

---

## Project structure

```
src/
  components/        UI components (AppShell, Header, RoleSwitcher, BookingTable,
                     FilterBar, StatusBadge, CustomerTypeCard, ActivationCard,
                     StepProgress, FormSection, ReviewSummary, ConfirmationScreen,
                     ExportButton, BookingDrawer, DashboardCard, …)
    ui/              Primitives (Button, Field/inputs, Eyebrow, Lockup, Chip)
  pages/             Login, Dashboard, NewBooking, AdminOverview, ExportView
    booking/         ActivationDetailFields (conditional Step-4 field sets)
  data/              catalog (activations, customer types, statuses, options),
                     seed bookings, repository
  hooks/             useBookings
  types/             domain types (PartnerInfo, BookingSubmission, … )
  utils/             validation, excel, summary, details, format, booking factory,
                     storage, asset
  styles/            tokens.css + portal.css (both scoped under .sk-portal)
  App.tsx            top-level routing + state
  main.tsx           mount point
public/brand/        logos + activation photography
```

---

## Design system

The look follows the **Selected × Kodak 2027 build** design language: warm greige
canvas, charcoal/ink typography, an oak/honey accent, and Kodak red/yellow used
sparingly as functional signal only. Roboto Slab for editorial titles, Inter for
UI, JetBrains Mono for data. Flat surfaces, 1px hairlines, ALL-CAPS eyebrows.

---

## Notes

- Seed data is clearly **demo content** and is written to localStorage on first load.
- Cost figures and partner names in seed data are illustrative.
- This MVP intentionally has no auth; the role switcher is for demonstration only.
