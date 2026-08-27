# 02 — Design Patterns

The frontend is deliberately small and uses a handful of repeated patterns rather than
an abstraction layer. Knowing these six patterns is enough to work anywhere in the app.

---

## Pattern 1 — Context + custom hook for auth (Provider / Consumer)

**Where:** `src/context/authContext.jsx`, consumed everywhere via `useAuth()`.

- A single `AuthContext` created with `createContext()`.
- `AuthProvider` is the **only** stateful auth owner. It exposes a plain object
  `{ user, token, login, logout, loading }` as the context value.
- Components never call `useContext(AuthContext)` directly — they use the
  `useAuth()` wrapper hook. This keeps the context object private to the module.
- **Boot-gating:** the provider renders a spinner instead of `children` while
  `loading`, so no consumer ever has to handle "auth not ready yet".

```jsx
export const useAuth = () => useContext(AuthContext);

const { user, logout } = useAuth();
const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';
```

**Why this and not Redux:** there is exactly one piece of cross-cutting state (who is
logged in). Everything else is page-local. A store would be pure overhead.

---

## Pattern 2 — Single Axios instance with a request interceptor (API gateway)

**Where:** `src/api/axiosClient.jsx`, default-exported as `API`.

```jsx
const API = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' }});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});
```

- Every page imports the same configured instance: `import API from '../api/axiosClient'`.
- **Auth is transparent** — callers never set the `Authorization` header themselves.
- `baseURL` centralises the API host in one place (`http://38.242.201.229/api`).
- There is **no response interceptor** — `401` handling is done per-call in each page
  (see Pattern 4). A single response interceptor that called `logout()` would be the
  natural next refactor.

**Anti-example:** `src/pages/SaleOrder.jsx` imports `axios` directly *and* `API`. Don't
copy it — always use `API`.

---

## Pattern 3 — The "CRUD list page" template

**Where:** `Customers.jsx`, `Users.jsx`, `Items.jsx` (and partly `Dashboard.jsx`).

Each of these pages is built from the same parts:

| Part | Implementation |
|------|----------------|
| Column defs | a module-scope `HEADERS = [{ label, align, width }]` array |
| Blank form | a module-scope `initialFormData` object |
| Row data | `useState([])`, replaced wholesale after each fetch |
| Server pagination | `page`, `limit`/`*_PER_PAGE`, `totalPages` state; sent as query params |
| Search | `searchTerm` state, sent as `&search=`; resets `page` to 1 on change |
| Fetch fn | `fetchX()` — sets loading, GETs, parses `res.data.<collection>`, catches 401 |
| Auto-refresh | `setInterval(fetchX, 30000)` in a `useEffect`, cleared on unmount |
| Add + Edit | **one** shared `<XxxFormDialog>` component, `isEdit` prop switches labels/handler |
| View | a separate read-only `<ViewXxxDialog>` component |
| Mutations | `POST`/`PATCH`/`DELETE` then re-call `fetchX()` (no local patching) |
| Row-level auth | `isSuperAdmin` hides Edit/Delete buttons |

New list screens should be cut from this same template for consistency.

---

## Pattern 4 — Local async state machine: `loading` / `error` / `data`

**Where:** every data-fetching component.

Three coordinated `useState`s model the request:

```jsx
const [loading, setLoading] = useState(true);
const [error, setError]     = useState(null);
const [data, setData]       = useState([]);   // or null for single objects
```

Rendering is a manual switch on those:

```jsx
if (loading && data.length === 0) return <CircularProgress/>…;   // first load only
if (error && data.length === 0)   return <Alert severity="error">{error}</Alert>;
// else: render content, with a non-blocking <Alert severity="warning"> if error && data exists
```

The `&& data.length === 0` guard means a **background refresh failure doesn't blow away
already-rendered data** — it downgrades to a warning banner.

**401 convention** (repeated in every `catch`):

```jsx
if (err.response?.status === 401) {
  setError('Session expired. Logging out...');
  setTimeout(logout, 2000);
} else {
  setError('Failed to load …');
}
```

---

## Pattern 5 — Controlled MUI dialogs for create/edit

**Where:** `Customers.jsx`, `Users.jsx`, `Items.jsx`.

- Dialog visibility is boolean state on the parent (`isAddModalOpen`,
  `isEditModalOpen`, `isViewModalOpen`).
- Form fields are **fully controlled** off a single `formData` object; one generic
  change handler:

  ```jsx
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  ```

- Add vs Edit is decided by whether `editingX` is `null`; the same submit path picks
  `post`/`patch` and the URL: `API[method](url, payload)`.
- **Edit-mode password rule** (`Users.jsx`): if the password field is left blank the
  key is stripped from the payload so the backend keeps the old hash.
- **Empty-string → `null` normalisation** (`Customers.jsx`): optional fields
  (`latitude`, `region`, …) are converted to `null` before `POST` so the DB doesn't
  choke on `""`.
- The form dialog is extracted as its own component and receives everything by props
  (`CustomerFormDialog`), so Add and Edit reuse one JSX tree.

---

## Pattern 6 — Optimistic update with rollback

**Where:** `Users.jsx` → `handleToggleStatus`.

```jsx
setTogglingId(userId);                       // per-row spinner
setOriginalUsers(prev => prev.map(patch));   // 1. apply locally, immediately
try   { await API.patch(`/users/toggle-status/${userId}`, { is_active: nextStatus }); }
catch { setOriginalUsers(prev => prev.map(revert));  setError(...); }   // 2. roll back
finally { setTogglingId(null); }
```

Used only for the cheap boolean toggle where instant feedback matters. Every other
mutation uses the safer refetch approach (Pattern 3).

---

## Supporting patterns

### Excel export (report pages)
`xlsx-js-style` builds an **array-of-arrays** where each cell is `{ v: value, s: style }`.
A shared `headerStyle` (brand green `#2E7D32` fill, white bold) and `bodyStyle` (thin
borders, centered, wrap). `worksheet['!merges']` mirrors the on-screen `rowSpan` cell
merges; `worksheet['!cols']` sets column widths. Filename is generated from the active
filters.

### "All + multi-select" dropdown
Report user-pickers support selecting individual sale executives *or* an "All"
sentinel. `handleNameChange` enforces the rules: picking "All" clears the rest;
picking an individual removes "All"; clearing everything snaps back to "All".

### Presentational sub-components
Small pure components declared in the same file for readability:
`KpiCard` (Dashboard), `CustomerFormDialog` / `ViewCustomerDialog` (Customers). They
take data via props and hold no state.

### Config-driven rendering
UI is frequently `.map()`-ed from a config array rather than hand-written:
`kpis[]` → KPI cards, `HEADERS[]` → `<TableCell>`s, `REGIONS[]` / `AVAILABLE_ROLES[]`
→ `<MenuItem>`s, `[{label,value}]` arrays → view-dialog rows.

### Styling: `sx`-only, brand tokens inline
No CSS modules, no styled-components files. All styling is the MUI `sx` prop.
Recurring literals: brand green `#2e7d32` / hover `#1b5e20` / light `#e8f5e9`,
table-head grey `#f5f5f5`, tiny table fonts `0.65–0.70rem`. The two global CSS files
(`src/index.css`, `src/App.css`) are leftover Vite boilerplate and are effectively
overridden by MUI `<CssBaseline/>`.
