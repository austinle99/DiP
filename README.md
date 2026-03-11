# Demand Intelligence Platform

A full-stack B2B logistics demand forecasting platform with AI-driven demand predictions, customer analytics, and container mix optimization for shipping and logistics operations.

## Features

- **Portfolio Overview** — KPI dashboard with TEU forecasts, monthly trend charts, and top customer rankings
- **Customer 360** — Customer-level logistics summary with lifetime value, on-time rates, and shipment tracking
- **Container Mix & Seasonality** — Filterable breakdown of container types with seasonal demand indices
- **Container Recommendation** — AI-powered container allocation workspace with explainability badges
- **Authentication** — JWT-based auth with role-based access control (Admin, Analyst, Viewer)

All AI predictions include reason codes (explainability mandate) and sparse-data warnings when relying on fallback heuristics.

## Tech Stack

| Layer | Tool |
|-------|------|
| **Frontend** | React 18, TypeScript 5, Vite, TailwindCSS 3 |
| **State** | TanStack React Query (server), Zustand (client) |
| **Charts** | Recharts |
| **Backend** | Node.js, Express 5, TypeScript |
| **Database** | PostgreSQL 16, Prisma ORM |
| **Auth** | JWT + bcrypt, role-based middleware |
| **Validation** | Zod (request schemas) |
| **Security** | Helmet, CORS, rate limiting |
| **Deployment** | Docker, docker-compose, nginx |
| **CI** | GitHub Actions (lint + build + test) |

## Quick Start

### Prerequisites

- Node.js >= 20
- npm >= 9
- Docker & Docker Compose (for full-stack mode)

### Option 1: Frontend Only (Mock Data)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Opens at `http://localhost:5173` with mock API handlers — no backend needed.

### Option 2: Full Stack with Docker

```bash
# Set a secure JWT secret
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# Start PostgreSQL + API + Frontend
docker compose up --build

# Seed the database (first run only)
docker compose exec api npx tsx prisma/seed.ts
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| API | http://localhost:3001/api |
| Health Check | http://localhost:3001/api/health |

### Option 3: Local Development (Backend + Frontend)

**Terminal 1 — Database:**
```bash
docker compose up db
```

**Terminal 2 — Backend:**
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

**Terminal 3 — Frontend:**
```bash
cd frontend
# Edit .env: set VITE_ENABLE_MOCKS=false
npm run dev
```

## API Endpoints

All endpoints (except auth and health) require `Authorization: Bearer <token>` header.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check + DB connectivity |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT token |
| GET | `/api/portfolio/overview` | Dashboard KPIs, trends, top customers |
| GET | `/api/customers` | Customer list with TEU totals |
| GET | `/api/customers/:customerId` | Customer 360 detail |
| GET | `/api/containers/mix` | Container mix data (filterable) |
| POST | `/api/recommend/container` | AI container recommendation |

### Auth Example

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secure123!","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secure123!"}'
# Returns: { "token": "eyJ...", "user": { ... } }

# Use token
curl http://localhost:3001/api/portfolio/overview \
  -H "Authorization: Bearer eyJ..."
```

### Seed Users (Development)

| Email | Password | Role |
|-------|----------|------|
| admin@dip.local | admin123! | ADMIN |
| analyst@dip.local | analyst123! | ANALYST |

## Project Structure

```
demand-intel-platform/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment validation, DB client
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── routes/           # Express route handlers
│   │   ├── services/         # Business logic layer
│   │   ├── utils/            # Error classes
│   │   └── server.ts         # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (7 models)
│   │   └── seed.ts           # Development seed data
│   ├── Dockerfile            # Multi-stage production build
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/       # Layout + shared UI components
│   │   ├── lib/api/          # API client (mock/real toggle)
│   │   ├── lib/mocks/        # Mock handlers for offline dev
│   │   ├── pages/            # Route-level components
│   │   └── main.tsx          # App entry point
│   ├── Dockerfile            # Nginx production build
│   ├── nginx.conf            # SPA routing + API proxy
│   └── .env.example
├── docs/ui/                  # Domain glossary, API contract, acceptance criteria
├── docker-compose.yml        # Full-stack orchestration
├── .github/
│   ├── workflows/ci.yml      # CI pipeline (frontend + backend)
│   └── dependabot.yml        # Automated dependency updates
└── SECURITY.md               # Vulnerability reporting policy
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Secret for signing JWT tokens | — |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `PORT` | API server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:3001/api` |
| `VITE_ENABLE_MOCKS` | Use mock handlers | `true` |

## Database Schema

7 models with proper indexes and referential integrity:

- **User** — Auth accounts with roles (ADMIN, ANALYST, VIEWER)
- **Customer** — Shipping line accounts with tiers and regions
- **TeuRecord** — Monthly booked/forecast TEU per customer
- **ContainerMix** — Monthly container type breakdown per customer/trade lane
- **Booking** — Shipment records with status tracking
- **SeasonalIndex** — Quarterly demand indices per trade lane
- **Recommendation** — Persisted AI container recommendations

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT authentication on all data endpoints
- Role-based authorization middleware
- Helmet security headers
- CORS restricted to configured origin
- Rate limiting (100 req / 15 min per IP)
- Request validation with Zod schemas
- SQL injection prevention via Prisma ORM
- No secrets committed — use `.env` files
- Dependabot monitoring for dependency vulnerabilities

## License

Proprietary. All rights reserved.
