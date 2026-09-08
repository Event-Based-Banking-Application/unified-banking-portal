# Event-Driven Banking Platform — Front-End Plan

## What we're building

A React (TanStack Start) front-end for your Spring Boot event-driven banking
platform. One shared login screen. After sign-in, the UI loads dynamically based
on the authenticated user's role and permissions. Three role surfaces live in
one app:

- **Customer** — self-service banking: view accounts/balances, transfer money,
  raise requests (new user, new account) that go to Bank Admin for approval.
- **Bank Admin** — approves/rejects customer requests, manages bank-super-users,
  views customers and accounts.
- **System Admin** — infrastructure console: service health, event stream /
  queue depth, audit log.

Backend is mocked for this build (swap-in API layer ready for your Spring Boot
API). Auth is represented as OAuth2/Keycloak-style: a token carries roles and
permissions. We build custom **login and signup** pages that produce a mock
session/token. A thin auth service abstracts this so a real Keycloak redirect
flow can replace it later without touching UI.

### Design direction (decided)

Clean, trustworthy banking console — **dark slate base with a single confident
accent**, dense tabular data for admin surfaces, card-led summaries for the
customer, status pills for event/approval states. Persistent left rail that
changes its items per role. No glassmorphism, no neon, no purple gradients.
Typography: Inter (UI) + JetBrains Mono (numeric/event/terminal data).
Restraint over decoration; motion is subtle (hover reveals, live-dot pulses,
panel slide-ins). This is designed directly from your request — not from the
discarded prototype directions.

## Architecture

### Auth & roles (client-side mock, Keycloak-shaped)

```
src/lib/auth/
  types.ts            # Role, Permission, SessionUser, AuthSession
  permissions.ts      # role -> permission[] map + can() helper
  mock-auth.ts        # mock sign-in / sign-up / sign-out, mints a fake JWT
  auth-context.tsx   # AuthProvider: session state, login(), logout()
  use-auth.ts         # useAuth() hook
```

- Roles: `customer`, `bank_admin`, `system_admin`.
- Permission keys, e.g. `accounts:read`, `accounts:transfer`,
  `requests:create`, `requests:approve`, `users:manage`, `infra:read`,
  `audit:read`.
- `can(perm)` gate used in components to show/hide actions and nav items.
- Session stored in memory + localStorage (mock). The `auth-context` exposes
  `login(email, password)` returning a `SessionUser` with role + permissions.
- A `ROLES` constant drives the dynamic left rail and route guards.
- Swap point: `mock-auth.ts` is the only file that changes when you wire
  Keycloak — the rest of the app stays the same.

### Routes

Public:
- `/auth` — shared login page (role-agnostic; role resolved from the token).
- `/signup` — customer self-signup (creates a `customer` role request — in mock
  mode it's auto-pending; real flow: bank admin approves).

Protected (under `src/routes/_authenticated/`):
- `dashboard.tsx` — role-aware landing. Redirects to the right default per role
  (customer → accounts, bank admin → approvals, system admin → console).
- Customer:
  - `accounts.tsx` — accounts + balances.
  - `account.$id.tsx` — account detail + transactions.
  - `transfer.tsx` — make a transfer.
  - `requests.tsx` — raise + track requests (new account, new user, etc.).
- Bank Admin:
  - `approvals.tsx` — approval queue (approve/reject).
  - `customers.tsx` — customer list + detail.
  - `bank-users.tsx` — bank super-user management.
- System Admin:
  - `console.tsx` — service health, queue depth, throughput.
  - `events.tsx` — event stream (tailing feed).
  - `audit.tsx` — immutable audit log.
- `profile.tsx` — shared profile/settings + sign-out.

### Dynamic UI shell

`src/components/app-shell.tsx`:
- Left rail: renders nav items filtered by `can(perm)` for the current role.
- Top bar: user identity, role badge, global search, sign-out.
- `<Outlet />` for page content.
- A `RoleBadge` and `NavGroup` component keep the rail consistent across roles.

### Mock data layer

```
src/lib/mock/
  db.ts               # in-memory dataset (accounts, transactions, requests,
                      #   services, events, audit entries, users)
  api.ts              # async mock API mirroring your Spring Boot endpoints,
                      #   returns Promises with small delays
  seed.ts             # seed data for 3 demo users (one per role)
```

- `api.ts` is the only module the UI calls; it mirrors the endpoint shapes your
  Spring Boot API will expose, so swapping to real fetch calls is a one-file
  change.
- Demo credentials surfaced on the login page for quick role switching.

### Components

- `DataTable` — reusable dense table (services, requests, transactions, audit).
- `StatusPill` — committed/pending/degraded/alert states.
- `StatCard` — KPI tiles (throughput, queue depth, balances).
- `EventFeed` — tailing event stream list.
- `ApprovalRow` — request row with approve/reject actions (permission-gated).
- `TransferForm`, `RequestForm` — customer-facing forms.
- `EmptyState`, `PageHeader`, `RoleBadge`, `NavGroup`.

### Theming

- Extend `src/styles.css` tokens: dark slate background, single accent (a calm
  teal/blue-green for "ok/active"), amber for "pending", red for "alert".
  All via semantic tokens (`--color-accent`, `--color-warn`, `--color-danger`),
  no hard-coded hex in components.
- Inter + JetBrains Mono loaded via `<link>` in `__root.tsx` head.

## Build order

1. Auth foundation: types, permissions map, mock-auth, AuthProvider, `useAuth`.
2. App shell: left rail + top bar driven by permissions; role badge.
3. Login (`/auth`) + signup (`/signup`) pages; route guard under
   `_authenticated/`.
4. Mock data layer (`db`, `api`, `seed`) + demo credentials on login.
5. Customer surfaces: dashboard, accounts, account detail, transfer, requests.
6. Bank Admin surfaces: approvals queue, customers, bank-users.
7. System Admin surfaces: console, events, audit.
8. Shared profile + sign-out hygiene.
9. Head metadata per route; polish pass.

## Out of scope (this build)

- Real Keycloak/OAuth2 redirect wiring (mock now; documented swap point).
- Real Spring Boot API calls (mock now; documented swap point).
- Realtime websockets (event stream is simulated with a polling/interval feed).
- Notifications/email.
