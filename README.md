# Field Activity Logger

A lightweight, **mobile-first, offline PWA** for a banking operations officer to
log field activity in under 30 seconds and export it — with strict column
alignment — into the corporate Excel tracker.

- **Zero backend.** All data lives on the device (IndexedDB via Zustand
  `persist`). Nothing is sent anywhere.
- **Offline-first.** Installable PWA with a service worker; works with no signal.
- **Strict export.** A "Copy for Excel (TSV)" button and an `.xlsx` download,
  both emitting the exact 12-column layout the corporate workbook expects.

## Stack

Vite + React + TypeScript · Tailwind CSS · Zustand (IndexedDB persist) ·
SheetJS (`xlsx`) · `vite-plugin-pwa`.

> Vite (not Next.js) because this is a client-only offline app with no server
> concerns. UI primitives are hand-rolled Tailwind components to keep the
> dependency surface small for a field tool.

## Scripts

```bash
npm install     # install dependencies
npm run dev     # local dev server
npm run build   # typecheck + production build (dist/)
npm run preview # serve the built app (test PWA/offline)
npm test        # run the deterministic unit tests
```

## Data model

Captured per entry: date, activity type (`Administration`, `Deployment`,
`Business Development`, `Merchant Visit`, `Idle Recall`), terminal count,
merchant name/location, customer issues, action taken, status
(`Completed` / `Pending`).

Auto-derived (never typed): `week_key` (ISO `YYYY-Www`), `month_key`
(`mmm-YYYY`), plus officer/branch pulled from Settings.

## Export column contract (A–L)

| Col | Header | Source |
|-----|--------|--------|
| A | Date | `activity_date`, formatted `DD-mmm-YYYY` |
| B | Week Key | ISO `YYYY-Www` |
| C | Month Key | `mmm-YYYY` |
| D | Officer Name | Settings |
| E | Branch Name | Settings |
| F | Activity Type | — |
| G | Merchant Name | — |
| H | Merchant Location | — |
| I | Customer Issues / Challenges Noted | — |
| J | Action Taken / Resolution | — |
| K | Status | — |
| L | Terminal Count | integer |

**TSV** emits data rows only (no header) so you click cell `A2` in the official
workbook and paste. Newlines/tabs inside a cell are flattened so rows stay
aligned. The **.xlsx** download includes the header row.

The date/week/month formatting, KPI math, and export mapping are pure functions
under `src/lib/` with unit tests (`*.test.ts`) — that logic is the contract with
the corporate sheet, so it is tested rather than trusted.

## Privacy note

Merchant names/locations are stored **only** in this browser's local storage on
the device. There is no sync, telemetry, or external call. Clearing site data or
uninstalling the PWA erases the log — export regularly.
