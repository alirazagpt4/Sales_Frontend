# CLAUDE.md

Guidance for Claude Code (and other AI assistants) when working in this repository.

## What this project is

**FSPL Portal** (package name `sales-admin`) — an internal **web admin portal** for
**Farm Solutions (Pvt) Ltd**. It is the back-office companion to a field **sales-force
mobile app**: field "Sale Executives" record customer visits, meter readings, day
start/leave status and sale orders on the phone; this portal lets admins manage the
master data (users, customers, items) and pull reporting on that field activity.

It is a **single-page React app** that talks to a REST backend over Axios. There is
**no backend code in this repo** — only the frontend.

## Tech stack

| Concern            | Choice                                             |
|--------------------|----------------------------------------------------|
| Framework          | React 19 (function components + hooks only)        |
| Build tool         | Vite 7 (`type: module`, ESM everywhere)            |
| Routing            | react-router-dom v7 (`BrowserRouter`)              |
| UI library         | MUI v7 (`@mui/material`, `@mui/icons-material`)    |
| Styling            | MUI `sx` prop + Emotion; two legacy global CSS files |
| HTTP               | Axios (single shared instance in `src/api/axiosClient.jsx`) |
| Charts             | Recharts (`src/pages/Dashboard.jsx`)               |
| Excel export       | `xlsx-js-style` (report pages)                     |
| Auth state         | React Context (`src/context/authContext.jsx`) + `localStorage` |
| Lint               | ESLint 9 flat config (`eslint.config.js`)          |
| Language           | Plain JavaScript / JSX — **no TypeScript**         |

## Commands

```bash
npm install
npm run dev       # Vite dev server (default http://localhost:5173)
npm run build     # production build -> dist/
npm run preview   # serve the built dist/
npm run lint      # ESLint over the repo
```

There is **no test setup** in this project.

## Repository layout

```
src/
  main.jsx                 # entry: wraps <App/> in <AuthProvider/>
  App.jsx                  # all routes; auth gate (public vs protected)
  api/axiosClient.jsx      # shared Axios instance + JWT request interceptor
  context/authContext.jsx  # AuthProvider, useAuth() hook, login/logout, boot loader
  components/
    Layout.jsx             # AppBar + Sidebar + <Outlet/> shell for protected pages
    Header.jsx             # top AppBar, user menu, logout, sidebar toggle
    Sidebar.jsx            # permanent MUI Drawer, collapsible, nested "Reports" group
    Footer.jsx             # static footer
  pages/
    Login.jsx              # unauthenticated login form
    Dashboard.jsx          # KPI cards + Recharts activity trend (chart data is mocked)
    Customers.jsx          # CRUD table + add/edit/view dialogs, server pagination
    Users.jsx              # CRUD table + dialogs, status toggle, server pagination
    Items.jsx              # CRUD table + dialogs, server pagination
    SaleOrder.jsx          # read-only master/detail (plain HTML table — the odd one out)
    Reports.jsx            # Daily Visit Report + Excel export
    SummaryReports.jsx     # Summary Visit Report + Excel export
    MeterReadingReports.jsx # Meter reading report + image proof modal + Excel export
    VisitVerificationReport.jsx
    VisitCountReport.jsx
public/                    # farmsolution.png / .svg logo assets (served from /)
docs/                      # architecture & pattern notes (start here)
```

## Key conventions to follow when editing

- **Function components + hooks only.** No class components, no HOCs.
- **API calls go through `import API from '../api/axiosClient'`.** Never import `axios`
  directly in a page (`SaleOrder.jsx` does — don't copy it). The interceptor attaches
  `Authorization: Bearer <token>` from `localStorage` automatically.
- **Auth:** read user/token via `const { user, token, login, logout } = useAuth()`.
  `user.role` drives permissions — `user?.role?.toLowerCase() === 'superadmin'` gates
  edit/delete actions (`isSuperAdmin`). Keep that check consistent.
- **On `401`:** pages call `setError(...)` then `setTimeout(logout, 2000)`. Match this.
- **Styling:** use the MUI `sx` prop inline. The brand green is `#2e7d32` (hover
  `#1b5e20`); table header grey is `#f5f5f5`. Do not add a CSS framework.
- **Data tables** follow one shape: `TableContainer/Table` + a `HEADERS` array, server
  pagination via `page`/`limit` state, add/edit share one `<XxxFormDialog>` component,
  a separate view dialog, and a `fetchXxx()` that is re-run after every mutation.
- **Auto-refresh:** list pages poll with `setInterval(fetch, 30000)` and clear it on
  unmount. Keep the cleanup.
- **Comments in the codebase are bilingual (Roman Urdu + English).** Match the file
  you are editing; don't mass-rewrite existing comments.
- **`initialFormData` / `initialKpis`** objects are declared at module scope and reused
  to reset form state.

## Known rough edges (don't treat as reference examples)

- `BASE_URL` is a hard-coded IP in `src/api/axiosClient.jsx` — no `.env` usage.
- Dashboard chart uses `mockDailyActivityData`, not real API data.
- `SaleOrder.jsx` uses raw `<table>` and imports `axios` directly — inconsistent with
  every other page.
- `authContext.jsx` line 53 has a stray `` `` `` token; `Sidebar.jsx` line 124 has a
  copy-paste bug in a `selected={}` path check.
- No route-level role guard — every protected route renders for any logged-in user;
  only in-page `isSuperAdmin` checks hide buttons.
- `Customers.jsx` edit modal sends `city_id` but add modal state seeds `cityId`.

See `docs/` for the full write-up of flow, patterns, and implementation notes.
