# Demand Intelligence Platform

A B2B logistics demand forecasting dashboard built with React, TypeScript, and TailwindCSS. The platform provides AI-driven demand predictions, customer analytics, and container mix optimization for shipping and logistics operations.

## Features

- **Portfolio Overview** — KPI dashboard with TEU forecasts, monthly trend charts, and top customer rankings
- **Customer 360** — Customer-level logistics summary with demand scoring and churn signals
- **Container Mix & Seasonality** — Filterable breakdown of container types with seasonal demand patterns
- **Container Recommendation** — AI-powered container allocation workspace with explainability badges

All AI predictions are accompanied by reason codes (explainability mandate) and sparse-data warnings when relying on fallback heuristics.

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build | Vite 5 |
| Styling | TailwindCSS 3 |
| State (server) | TanStack React Query |
| State (client) | Zustand |
| Charts | Recharts |
| Tables | TanStack React Table |
| Icons | Lucide React |
| Testing | Vitest + React Testing Library |
| CI | GitHub Actions |

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app starts at `http://localhost:5173`. It uses mock API handlers by default — no backend required.

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

## Project Structure

```
demand-intel-platform/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/      # AppLayout, Sidebar, TopBar
│   │   │   └── shared/      # KpiCard, StatusBadge, ReasonCodeBadge, LoadingState
│   │   ├── lib/
│   │   │   ├── api/          # API client, TypeScript contracts
│   │   │   └── mocks/        # Mock handlers (swap for real API later)
│   │   ├── pages/            # Route-level page components
│   │   └── main.tsx          # App entry point
│   ├── .env.example          # Environment variable template
│   └── vitest.config.ts      # Test configuration
├── docs/ui/                   # Domain glossary, API contract, acceptance criteria
├── .github/
│   ├── workflows/ci.yml      # CI pipeline (lint + build + test)
│   └── dependabot.yml        # Automated dependency updates
└── SECURITY.md                # Vulnerability reporting policy
```

## Environment Variables

Copy the template and customize:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3001/api` |
| `VITE_ENABLE_MOCKS` | Use mock handlers instead of real API | `true` |

## Backend Integration

The API client ([frontend/src/lib/api/client.ts](frontend/src/lib/api/client.ts)) is currently wired to mock handlers. To connect a real backend:

1. Set `VITE_ENABLE_MOCKS=false` in your `.env`
2. Set `VITE_API_BASE_URL` to your backend URL
3. Swap mock imports in `client.ts` with `fetch()` calls
4. The API contract is defined in [docs/ui/UI_API_CONTRACT.json](docs/ui/UI_API_CONTRACT.json)

## License

Proprietary. All rights reserved.
