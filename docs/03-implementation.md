# 03 — Implementation Notes

File-by-file detail, conventions, the API surface as used by the client, and the
current tech-debt list.

---

## Build & tooling

- **Vite 7**, `type: "module"`. Config (`vite.config.js`) is bare — just
  `@vitejs/plugin-react` (Babel Fast Refresh). No path aliases, no proxy, no env
  plumbing.
- **ESLint 9 flat config** (`eslint.config.js`): `js.recommended` +
  `react-hooks.recommended` + `react-refresh/vite`. One custom rule —
  `no-unused-vars` ignores `^[A-Z_]` identifiers. `dist` is globally ignored.
- **No** TypeScript, Prettier config, test runner, Husky, or CI in the repo.
- Entry HTML `index.html` sets the tab title `FSPL - Portal` and favicon
  `/farmsolution.svg`.

## Dependencies actually used

| Package | Used by |
|---------|---------|
| `react`, `react-dom` (19) | everything |
| `react-router-dom` (7) | `App.jsx`, `Sidebar.jsx` (`useNavigate`, `useLocation`), `Layout.jsx` (`Outlet`) |
| `@mui/material`, `@emotion/*` | all UI |
| `@mui/icons-material` | icons throughout |
| `axios` | `src/api/axiosClient.jsx` (and, wrongly, `SaleOrder.jsx`) |
| `recharts` | `Dashboard.jsx` line chart |
| `xlsx-js-style` | all 5 report pages (`import XLSX from 'xlsx-js-style'`) |
| `xlsx` | imported only in a commented-out line in `Reports.jsx` — effectively unused |

## Runtime configuration

`src/api/axiosClient.jsx`:

```js
const BASE_URL = 'http://38.242.201.229/api';
// const BASE_URL = 'http://localhost:3000/api';   // toggled by hand for local dev
```

Hard-coded, switched by editing the file. Report image URLs are built against
`http://38.242.201.229:3000/public/<filename>` (also hard-coded, and on a *different*
port than the API).

`localStorage` keys owned by the app: `token`, `username`, `fullname`, `role`.

---

## Component reference

### `src/main.jsx`
Mounts `<App/>` inside `<AuthProvider/>`. No `StrictMode`.

### `src/App.jsx`
Route table + auth gate. See [`01-frontend-flow.md`](./01-frontend-flow.md) §3.
`Router` (`BrowserRouter`) is here, not in `main.jsx`.

### `src/context/authContext.jsx`
`AuthProvider`, `useAuth`. Boot effect + `login` / `logout`. Renders its own
full-screen loader while `loading`.
- ⚠️ Line ~53 contains a stray `` `` `` (two back-ticks) left in the source — harmless
  (parsed as an empty tagged-template expression statement) but should be deleted.
- `console.log` calls for `user` are still in place.

### `src/components/Layout.jsx`
Fl: AppBar + Drawer + `<main>` with `<Outlet/>` and `<Footer/>`. Owns `open` (sidebar)
state; `drawerWidth = 240`, collapsed `64`. Animated width via `theme.transitions`.
Accepts an `onLogout` prop that is no longer used (Header reads `useAuth` directly).

### `src/components/Header.jsx`
Fixed `AppBar`, brand green `#2e7d32`. Hamburger → `handleDrawerToggle`. Avatar button
opens an MUI `Menu` with `Hi, {user.fullname}` and **Logout** (`logout()` from
`useAuth`). Avatar currently shows a `FilterListIcon` (placeholder).

### `src/components/Sidebar.jsx`
`variant="permanent"` `Drawer`. Width tracks `open`. Items: Dashboard, Customers,
Users, then a `Collapse` **Reports** group (Daily Visit, Summary Visit, Meter Reading,
Visit Verification, Visit Count). Active state via
`selected={location.pathname === '/route'}`.
- ⚠️ The "Visit Count Report" item's `selected` compares against
  `'/visit-verification-reports'` (copy-paste bug) — highlight is wrong for that item.
- Items/SaleOrder routes exist in `App.jsx` but have **no Sidebar entry** — reachable
  only by URL.

### `src/components/Footer.jsx`
Static `© 2026 Farm Solutions. All rights reserved.` Pushed to the bottom with
`mt: 'auto'` inside the flex-column `main`.

### `src/pages/Login.jsx`
Controlled `name` + `password`. `POST /users/admin/login` → destructures
`{ token, username, fullname, userRole }` from `response.data` → `login(...)` →
`navigate('/')`. Error from `err.response?.data?.message`. Logo `/farmsolution.png`.
- Note the field is labelled "Name" and sent as `name` (not email), despite a comment
  saying otherwise.

### `src/pages/Dashboard.jsx`
`GET /kpis`; expects `{ status: 'success', data: { totalUsers, totalCustomers,
totalVisits, activeUsers } }`. `kpis[]` config array → `<KpiCard>` grid.
`formatValue` uses `Intl.NumberFormat('en-IN')`.
- ⚠️ The Recharts `LineChart` is fed `mockDailyActivityData` (hard-coded 7-day array),
  **not** API data. Replace when a real endpoint exists.
- `<Grid item>` props are used — MUI v7 renamed these; may warn in console.

### `src/pages/Customers.jsx`
Full CRUD. Server pagination (`page`, `limit`, `totalPages` from
`res.data.pagination.totalPages`), `search`, 30s polling. `GET /cities` for the city
`<Select>`. `REGIONS` is a fixed 5-item list. Google-Maps link built from
`latitude`/`longitude`. Add/Edit via `CustomerFormDialog`; read-only
`ViewCustomerDialog`. Delete uses `window.confirm`.
- ⚠️ Add-modal seeds `formData.cityId` but the `<Select>` and edit path use `city_id`
  — the two code paths disagree on the key name.
- `getStatusChip` / `HEADERS` constant are defined but partly unused.

### `src/pages/Users.jsx`
CRUD + `handleToggleStatus` (optimistic, `PATCH /users/toggle-status/:id`).
`USERS_PER_PAGE = 10`. Debounced search (500 ms `setTimeout` in a `useEffect` on
`searchTerm`). Loads `/cities`, `/designations`, and all users (`?limit=1000`) for the
"Reports To" manager dropdown (filters out `designationId === 1`). 30s polling.
`AVAILABLE_ROLES = ['admin','user','superadmin']`; `REGIONS` is a 15-item list.
- Delete handler is fully commented out.
- Modal renders both a free-text "Designation" `TextField` **and** a "Designation"
  `Select` (`designationId`) — redundant.
- `useMemo` imported but not used.

### `src/pages/Items.jsx`
CRUD, cleanest of the three. `GET /items?page=&size=` → `{ items, totalPages }`.
Client-side `useMemo` filter on top of the server page for `item_code`/`item_name`.
`item_code` field is disabled in edit mode. 30s polling.

### `src/pages/SaleOrder.jsx`
Read-only master/detail. `GET /sale-orders` → `res.data.orders`. Click "View Detail"
sets `viewOrder` and renders a second table of `viewOrder.items`.
- ⚠️ **The outlier:** plain HTML `<table>`/`<button>` with inline `style`, no MUI, no
  loading/error UI, imports `axios` directly (unused) alongside `API`. Should be
  rewritten to match the other pages.

### Report pages — `Reports.jsx`, `SummaryReports.jsx`, `MeterReadingReports.jsx`, `VisitVerificationReport.jsx`, `VisitCountReport.jsx`
Shared structure (see [`01-frontend-flow.md`](./01-frontend-flow.md) §7 and
[`02-design-patterns.md`](./02-design-patterns.md) "Excel export"):

- On mount: `GET /users?page=1&limit=1000&is_active=true`, then filter out
  `designationId ∈ [null, 7, 8]` to get the field sales executives.
- Filters: `fromDate` / `toDate` (default = `new Date().toISOString().split('T')[0]`),
  a user picker (single `Select` in Summary/Meter, multi-select + "All" in
  Daily/Verification/Count), plus `region` (Summary) or `status` (Verification).
- `formatForDisplay(d)` → `"Aug 27, 2025"`; `formatTime(d)` → `"09:05 AM"`.
- `Reports.jsx` is the most complex: groups the response by date, renders merged
  (`rowSpan`) Date and "Day Start Info" cells, shows a "leave/present" branch, and a
  meter-reading image modal with `fetch`→blob download.
- Excel export mirrors the table (including merges) with `xlsx-js-style`.

---

## API surface (as consumed by the client)

Base: `http://38.242.201.229/api`. All requests carry `Authorization: Bearer <token>`
except login.

| Method | Path | Caller |
|--------|------|--------|
| POST | `/users/admin/login` | Login |
| GET | `/kpis` | Dashboard |
| GET | `/customers?page=&limit=&search=` | Customers |
| POST | `/customers/create-customer` | Customers |
| PATCH | `/customers/:id` | Customers |
| DELETE | `/customers/:id` | Customers |
| GET | `/cities` | Customers, Users |
| GET | `/designations` | Users |
| GET | `/users?page=&limit=&search=&is_active=` | Users, Reports (all) |
| POST | `/users/register` | Users |
| PATCH | `/users/:id` | Users |
| PATCH | `/users/toggle-status/:id` | Users |
| GET | `/items?page=&size=` | Items |
| POST | `/items/create-items` | Items |
| PATCH | `/items/:id` | Items |
| GET | `/sale-orders` | SaleOrder |
| GET | `/reports/daily-report?names=&fromDate=&toDate=` | Reports |
| GET | `/reports/summary-report?fromDate=&toDate=&region=` | SummaryReports |
| GET | `/reports/meter-reading…` | MeterReadingReports |
| GET | `/reports/visit-verification…` | VisitVerificationReport |
| GET | `/reports/visit-count…` | VisitCountReport |

Response envelopes are **not uniform**: `{data, pagination}` (customers),
`{items, totalItems, totalPages}` (items), `{users, totalPages}` (users),
`{status, data}` (kpis), `{orders}` (sale orders), `{report, meta}` (reports). Each
page parses its own shape defensively (`?? []`, `Array.isArray(...)`).

---

## Known issues / tech debt

| # | Item | File |
|---|------|------|
| 1 | API base URL hard-coded; no `.env` / `import.meta.env` | `api/axiosClient.jsx` |
| 2 | No response interceptor — every page re-implements 401→logout | `api/axiosClient.jsx` |
| 3 | Dashboard chart uses mocked data | `pages/Dashboard.jsx` |
| 4 | `SaleOrder.jsx` not migrated to MUI / shared patterns; imports `axios` directly | `pages/SaleOrder.jsx` |
| 5 | No route-level role guard; only in-page `isSuperAdmin` button hiding | `App.jsx` |
| 6 | Sidebar `selected` bug for "Visit Count Report" | `components/Sidebar.jsx` |
| 7 | Items & Sale Orders have no Sidebar link | `components/Sidebar.jsx` |
| 8 | `cityId` vs `city_id` key mismatch in add vs edit | `pages/Customers.jsx` |
| 9 | Stray `` `` `` token; leftover `console.log`s | `context/authContext.jsx` |
| 10 | Duplicate designation inputs (text + select) | `pages/Users.jsx` |
| 11 | Commented-out delete-user handler | `pages/Users.jsx` |
| 12 | `initialKpis.activeUsers` vs API `activeUsers`, and `system_start_date` formatting for a KPI that isn't rendered | `pages/Dashboard.jsx` |
| 13 | No `React.StrictMode`; MUI v7 `<Grid item>` deprecation warnings | `main.jsx`, several pages |
| 14 | Leftover Vite boilerplate CSS (`App.css`, `index.css`, `assets/react.svg`) | `src/` |
| 15 | No tests, no CI | repo |

## Suggested first refactors (low risk, high value)

1. Move `BASE_URL` to `import.meta.env.VITE_API_URL` with a `.env` fallback.
2. Add an Axios **response** interceptor that centralises `401 → logout` + redirect,
   then delete the per-page duplication.
3. Extract the CRUD-list scaffolding (fetch + pagination + polling + loading/error) into
   a `useServerTable(endpoint)` hook.
4. Rewrite `SaleOrder.jsx` on the shared table pattern.
5. Add a `<RequireRole role="superadmin">` route wrapper for admin-only pages.
