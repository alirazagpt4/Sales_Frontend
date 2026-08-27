# FSPL Portal — Frontend Documentation

This folder documents the architecture of the **FSPL Portal** admin frontend
(`sales-admin`), the internal web app used by Farm Solutions (Pvt) Ltd admins to
manage master data and report on field sales activity captured by the sales-force
mobile app.

| Doc | What's in it |
|-----|--------------|
| [`01-frontend-flow.md`](./01-frontend-flow.md) | How the app boots, authenticates, routes, and renders a page. Request/response lifecycle. Screen inventory. |
| [`02-design-patterns.md`](./02-design-patterns.md) | The recurring patterns: Context + hook auth, single Axios instance with interceptor, the "CRUD list page" template, controlled dialogs, optimistic updates, Excel export. |
| [`03-implementation.md`](./03-implementation.md) | Concrete implementation details, file-by-file notes, styling conventions, API endpoint map, and known issues / tech debt. |

## 30-second overview

```
main.jsx
  └─ <AuthProvider>          reads token + user from localStorage on boot
       └─ <App>              renders <Router>
            ├─ /login        public — <Login/>
            └─ / (protected) <Layout> = <Header/> + <Sidebar/> + <Outlet/> + <Footer/>
                 ├─ index                -> <Dashboard/>
                 ├─ /customers           -> <Customers/>   (CRUD)
                 ├─ /users               -> <Users/>       (CRUD + status toggle)
                 ├─ /items               -> <Items/>       (CRUD)
                 ├─ /sale-orders         -> <SaleOrder/>   (read-only)
                 └─ /reports, /summary-reports, /meter-reading-reports,
                    /visit-verification-reports, /visit-count-report
                                         -> filter form + table + Excel export
```

- **Auth token**: JWT string in `localStorage`, attached to every request by an Axios
  interceptor. No refresh-token flow; a `401` logs the user out.
- **State**: purely local (`useState`) per page + one global `AuthContext`. No Redux,
  no react-query, no global store.
- **Server does the paging/filtering**; pages send `page`, `limit`, `search`,
  `fromDate`, `toDate`, `names`, `region` as query params.
