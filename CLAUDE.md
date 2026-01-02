# artha.bot - Project Guide

> ML Robotics Platform - An open and accessible platform for AI robotics

## Quick Reference

**Run locally:**
```bash
# Frontend (dev server)
cd frontend && npm run dev

# Backend
uvicorn backend.main:app --reload

# Full stack (after frontend build)
cd frontend && npm run build && cd .. && uvicorn backend.main:app
```

**Deploy:**
```bash
cd artha-monolith && fly deploy
```

**Live:** https://artha-bot.fly.dev

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Fly.io                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    FastAPI Backend                        │  │
│  │  /api/*          → API routes (auth required)             │  │
│  │  /api/health     → Health check (public)                  │  │
│  │  /*              → Serve static frontend                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │  Clerk   │        │ Postgres │        │    R2    │
    │  (Auth)  │        │   (DB)   │        │ (Storage)│
    └──────────┘        └──────────┘        └──────────┘
```

---

## Folder Structure

```
artha-monolith/
├── CLAUDE.md              ← You are here
├── platform-spec.md       ← Full product spec (read this!)
├── README.md              ← Public quick start
│
├── backend/
│   ├── main.py            ← FastAPI entry point
│   ├── config.py          ← Environment settings
│   ├── auth/
│   │   ├── clerk.py       ← Clerk JWT verification
│   │   └── middleware.py  ← Auth middleware
│   ├── routes/
│   │   ├── health.py      ← /api/health
│   │   ├── projects.py    ← /api/projects/*
│   │   ├── experiments.py ← /api/experiments/*
│   │   ├── datasets.py    ← /api/datasets/*
│   │   └── jobs.py        ← /api/jobs/*
│   ├── db/
│   │   ├── connection.py  ← Postgres connection
│   │   ├── schema.sql     ← THE source of truth for DB
│   │   └── models.py      ← Pydantic models
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── main.ts        ← Entry point + router
│   │   ├── styles/        ← CSS files
│   │   ├── lib/           ← Utilities (api, auth, router)
│   │   ├── components/    ← Reusable UI components
│   │   ├── pages/
│   │   │   ├── landing/       ← / (public homepage)
│   │   │   ├── platform/      ← /platform/* (authed SPA)
│   │   │   │   ├── projects/
│   │   │   │   ├── datasets/
│   │   │   │   │   └── visualizer/
│   │   │   │   ├── experiments/
│   │   │   │   ├── jobs/
│   │   │   │   └── settings/
│   │   │   └── internal-docs/ ← /internal-docs (admin only)
│   │   └── api/           ← API client logic
│   └── ...
│
├── docs/                  ← Markdown docs (served at /internal-docs)
├── tests/
├── Dockerfile
└── fly.toml
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `platform-spec.md` | Full product spec - the vision |
| `backend/db/schema.sql` | Database schema - source of truth |
| `frontend/src/main.ts` | Frontend entry point + routing |
| `frontend/src/lib/auth.ts` | Clerk integration |
| `backend/auth/clerk.py` | JWT verification |

---

## Data Model (Summary)

See `platform-spec.md` for full details. Core entities:

- **User** - Authenticated via Clerk
- **Project** - Top-level container (one task = one project)
- **Experiment** - An approach within a project (forms trees)
- **Iteration** - A single training attempt within an experiment
- **Dataset** - Training data storage (LeRobot v2.1 format)
- **Asset** - Output blobs (checkpoints, configs)
- **Job** - Training job execution

**Relationships:**
```
User → Projects → Experiments → Iterations → Assets
                      ↓              ↓
                  Datasets ←──── (inputs)
```

---

## Auth Flow

1. **Frontend:** User clicks "Log In" → Clerk modal
2. **Frontend:** Clerk returns JWT token
3. **Frontend:** All API calls include `Authorization: Bearer <token>`
4. **Backend:** Middleware verifies JWT with Clerk public keys
5. **Backend:** Extracts `user_id` from token, attaches to request

---

## API Conventions

- All routes under `/api/`
- Auth required except `/api/health`
- JSON request/response
- Standard error format: `{ "error": "message" }`

---

## Frontend Routing

| Route | Page | Auth |
|-------|------|------|
| `/` | Landing page | Public |
| `/platform` | Dashboard | Required |
| `/platform/projects` | Projects list | Required |
| `/platform/projects/:id` | Project detail | Required |
| `/platform/datasets` | Datasets list | Required |
| `/internal-docs` | Internal docs | Admin only |

---

## Environment Variables

**Backend:**
- `DATABASE_URL` - Postgres connection string
- `CLERK_SECRET_KEY` - For JWT verification
- `R2_*` - Cloudflare R2 credentials

**Frontend:**
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk frontend key

---

## Common Tasks

### Add a new API endpoint
1. Create/edit file in `backend/routes/`
2. Add router to `backend/main.py`
3. Add types to `backend/db/models.py`

### Add a new frontend page
1. Create file in `frontend/src/pages/<section>/`
2. Add route in `frontend/src/main.ts`
3. Add styles in `frontend/src/styles/`

### Modify database schema
1. Edit `backend/db/schema.sql`
2. Run migration (TODO: set up migrations)
3. Update `backend/db/models.py`

---

## Design Tokens

**Typography:** Satoshi (fontshare.com/fonts/satoshi)
- Logo: Satoshi Medium
- Headings: Satoshi Medium/Bold
- Body: Satoshi Regular

**Colors:**
- Background: `#000000` (pure black)
- Text: `#ffffff`
- Text dim: `rgba(255, 255, 255, 0.6)`
- Glass: `rgba(255, 255, 255, 0.08)` + backdrop blur

---

## TODOs / Known Issues

- [ ] Set up Postgres schema
- [ ] Integrate Clerk auth
- [ ] Mobile hamburger menu (currently just compact header)
- [ ] Set up database migrations

---

## Getting Help

- Product spec: `platform-spec.md`
- This file: `CLAUDE.md`
- Internal docs: `/internal-docs` (when built)
