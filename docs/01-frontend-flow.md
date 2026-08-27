# 01 — Frontend Flow

## 1. Application bootstrap

```
index.html  ->  <div id="root">  +  <script src="/src/main.jsx">
```

`src/main.jsx`:

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
```

There is **no `React.StrictMode`** wrapper and **no theme provider** — MUI runs on its
default theme; only `<CssBaseline/>` is applied (inside `Layout.jsx`).

## 2. Auth bootstrap (`src/context/authContext.jsx`)

`AuthProvider` holds three pieces of state: `token`, `user`, `loading`.

On mount, a single `useEffect` runs once:

1. Reads `token`, `username`, `fullname`, `role` from `localStorage`.
2. If a token exists, populates `token` state and `user = { username, fullname, role }`.
3. Sets `loading = false`.

While `loading` is `true`, `AuthProvider` renders a **full-screen MUI spinner**
("Loading Admin Portal…") and nothing else — so `<App/>` never sees a half-initialised
auth state.

Exposed through context via the `useAuth()` hook:

| Value    | Type       | Notes |
|----------|------------|-------|
| `user`   | object/null| `{ username, fullname, role }` |
| `token`  | string/null| raw JWT |
| `login`  | fn         | `login(token, username, fullname, role)` — writes all four to `localStorage` **and** state |
| `logout` | fn         | clears those four `localStorage` keys and resets state |
| `loading`| bool       | boot flag |

There is no automatic token-expiry check on the client. Expiry is discovered lazily:
a request returns `401`, the page catches it and calls `logout()`.

## 3. Routing & the auth gate (`src/App.jsx`)

`App` pulls `{ token, user, loading, logout }` from `useAuth()` and computes
`isAuthenticated = !!token`.

- If `loading` → returns `null` (the provider is already showing its spinner).
- Routes are declared **conditionally** on `isAuthenticated`:

```
/login                 -> isAuthenticated ? <Navigate to="/"> : <Login/>

if isAuthenticated:
  / (element=<Layout/>)
    index                        -> <Dashboard/>
    customers                    -> <Customers/>
    users                        -> <Users/>
    reports                      -> <Reports/>
    summary-reports              -> <SummaryReports/>
    items                        -> <Items/>
    sale-orders                  -> <SaleOrder/>
    meter-reading-reports        -> <MeterReadingReport/>
    visit-verification-reports   -> <VisitVerificationReport/>
    visit-count-report           -> <VisitCountReport/>
else:
  *                     -> <Navigate to="/login">
```

Because the protected `<Route>` subtree is only mounted when `isAuthenticated`, a
logged-out user hitting `/customers` directly falls through to the catch-all and is
redirected to `/login`. When `logout()` flips `token` to `null`, the whole protected
subtree unmounts and the app re-renders on the login screen — no manual navigation
needed.

> **No role-based route guard.** Every protected route renders for *any* authenticated
> user regardless of `role`. Authorization is only enforced *inside* pages by hiding
> edit/delete controls (`isSuperAdmin`).

## 4. The authenticated shell (`src/components/Layout.jsx`)

```
<Box display=flex>
  <CssBaseline/>
  <Header drawerWidth onLogout handleDrawerToggle/>   fixed AppBar
  <Sidebar drawerWidth open/>                          permanent Drawer
  <Box component="main">
     <Toolbar/>            spacer under the fixed AppBar
     <Outlet/>             the active page
     <Footer/>
  </Box>
</Box>
```

- `Layout` owns one piece of state: `open` (sidebar expanded vs collapsed to 64px).
- `handleDrawerToggle` is passed to `Header`'s hamburger button.
- The `main` box width is computed as `calc(100% - {open ? 240 : 64}px)` with an MUI
  width/margin transition, kept in sync with the Drawer.
- `Header` gets `logout` and `user` straight from `useAuth()` (the `onLogout` prop is
  vestigial). The avatar menu shows `Hi, {user.fullname}` and a Logout item.
- `Sidebar` uses `useNavigate()` + `useLocation()` to navigate and to mark the active
  `ListItemButton` via `selected={location.pathname === '...'}`. The **Reports** entry
  is a `Collapse` group containing the five report routes.

## 5. Page render lifecycle (the common pattern)

Every data page (Dashboard, Customers, Users, Items, reports) follows this shape:

```
mount
  -> useState: loading=true, error=null, data=[]/null, (page, limit, filters…)
  -> useEffect / useCallback fetchX():
       setLoading(true)
       try:   const res = await API.get('/endpoint?params')
              setData(res.data.data ?? res.data.items ?? res.data.users ?? [])
              setTotalPages(res.data.pagination?.totalPages ?? res.data.totalPages ?? 1)
       catch: if 401 -> setError('Session expired…'); setTimeout(logout, 2000)
              else   -> setError('Failed to load …')
       finally: setLoading(false)
  -> render:
       loading && data empty  -> <CircularProgress/> block
       error   && data empty  -> <Alert severity="error">
       otherwise              -> toolbar (search + Add) / table / pagination / dialogs
```

List pages additionally set up `setInterval(fetchX, 30000)` for a 30-second
auto-refresh and clear it in the effect cleanup.

## 6. Mutation flow (create / update / delete / toggle)

1. User opens a controlled MUI `<Dialog>` (`isAddModalOpen` / `isEditModalOpen`).
   `formData` state is seeded from `initialFormData` (add) or the row (edit).
2. Inputs are **controlled** — one `handleFormChange({name,value})` updates
   `formData` by key.
3. On submit: `e.preventDefault()`, build payload (empty strings → `null` where the
   DB needs it), `await API.post/patch/delete(...)`.
4. On success: close the dialog and **re-run `fetchX()`** (or `setPage(1)`), so the
   table reflects server truth. Manual local array patching is deliberately avoided.
5. On error: `setError(err.response?.data?.error || err.response?.data?.message || fallback)`.

`Users.jsx` `handleToggleStatus` is the one **optimistic** mutation: it patches the
row in local state immediately, fires `PATCH /users/toggle-status/:id`, and reverts
the local change if the request throws.

## 7. Reports flow

Report pages (`Reports`, `SummaryReports`, `MeterReadingReports`,
`VisitVerificationReport`, `VisitCountReport`) share a distinct flow:

```
on mount   -> GET /users?page=1&limit=1000&is_active=true
              filter out designationId in [null, 7, 8] (non-field roles)
              -> populate the "Sale Executive" multi-select

user picks -> from/to date (default = today), user(s), optional region/status
"Generate" -> GET /reports/<kind>?names=…&fromDate=…&toDate=…[&region=…]
              response held in reportData (or error "No records found")

render     -> summary metric badges + a bordered <Table>
              (Reports groups visits by date with rowSpan-merged Date/Info cells)

"Export Excel" -> build a styled AoA with xlsx-js-style, brand-green headers,
                  cell merges mirroring the on-screen rowSpans, XLSX.writeFile(...)
```

Image proofs (meter readings) open in a `<Dialog>`; the URL is rebuilt as
`http://38.242.201.229:3000/public/<filename>` and downloaded via a `fetch` → `blob`
→ temporary `<a download>` click.

## 8. Screen inventory

| Route | Component | Type | Backend endpoint(s) |
|-------|-----------|------|---------------------|
| `/login` | `Login` | form | `POST /users/admin/login` |
| `/` | `Dashboard` | KPI + chart | `GET /kpis` (chart data mocked) |
| `/customers` | `Customers` | CRUD list | `GET/POST/PATCH/DELETE /customers*`, `GET /cities` |
| `/users` | `Users` | CRUD list + toggle | `GET /users`, `POST /users/register`, `PATCH /users/:id`, `PATCH /users/toggle-status/:id`, `GET /cities`, `GET /designations` |
| `/items` | `Items` | CRUD list | `GET /items`, `POST /items/create-items`, `PATCH /items/:id` |
| `/sale-orders` | `SaleOrder` | read-only master/detail | `GET /sale-orders` |
| `/reports` | `Reports` | filter + export | `GET /reports/daily-report` |
| `/summary-reports` | `SummaryReports` | filter + export | `GET /reports/summary-report` |
| `/meter-reading-reports` | `MeterReadingReport` | filter + export | `GET /reports/meter-reading*` |
| `/visit-verification-reports` | `VisitVerificationReport` | filter + export | `GET /reports/visit-verification*` |
| `/visit-count-report` | `VisitCountReport` | filter + export | `GET /reports/visit-count*` |
