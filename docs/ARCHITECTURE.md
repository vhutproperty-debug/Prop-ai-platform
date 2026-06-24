# Prop AI Architecture

## Overview

Prop AI is an AI-first Mumbai real estate operating system built on Next.js App Router with a layered architecture designed for scale.

```
┌─────────────────────────────────────────────────────────┐
│  Presentation (app/, components/)                       │
│  Homepage (static) · Admin CRM · Auth · API Routes    │
├─────────────────────────────────────────────────────────┤
│  Actions (actions/)          Server Actions + revalidation│
├─────────────────────────────────────────────────────────┤
│  Services (services/)        Business logic layer       │
├─────────────────────────────────────────────────────────┤
│  Data (models/, lib/db/)     Mongoose + MongoDB         │
├─────────────────────────────────────────────────────────┤
│  Validation (validations/)   Zod schemas                │
├─────────────────────────────────────────────────────────┤
│  Config (config/)            Env, constants             │
└─────────────────────────────────────────────────────────┘
```

## Folder Structure

| Path | Purpose |
|------|---------|
| `app/` | Routes, API handlers, layouts |
| `actions/` | Server Actions (leads, auth, search) |
| `services/` | Domain services — single source of business logic |
| `models/` | Mongoose schemas |
| `validations/` | Zod input validation |
| `types/` | Shared TypeScript types |
| `config/` | Environment and constants |
| `lib/` | Utilities, auth, DB, API helpers |
| `components/home/` | Homepage UI (**do not modify for backend work**) |
| `components/admin/` | Admin CRM components |
| `components/ui/` | Shadcn-style primitives |
| `data/` | Phase 1 static fallback data |
| `scripts/` | Seed and maintenance scripts |
| `docs/` | Documentation ([MODELS.md](./MODELS.md)) |

## Data Flow

### Public API Request
```
Client → app/api/* → Zod validation → Service → MongoDB / static fallback → JSON response
```

### Server Action
```
Client → actions/* → Zod validation → Service → revalidatePath → ActionResult
```

### Homepage (unchanged)
```
app/page.tsx → components/home/* → data/homepage.ts (static)
```

## Domain Modules

### Catalog (Projects, Builders, Localities)
- `services/catalog.service.ts`
- DB-first with static fallback from `data/homepage.ts`
- Ready for CMS admin CRUD in Phase 2

### AI Search
- `services/search.service.ts` — keyword + hybrid search
- `services/embedding.service.ts` — vector storage + cosine similarity
- `actions/search.ts` — Server Action entry point
- Wire OpenAI embeddings via `OPENAI_API_KEY`

### CRM / Leads
- `models/Lead.ts` — pipeline statuses
- `services/lead.service.ts` — CRUD, export, notes
- `services/crm.service.ts` — webhook notifications
- `app/admin/leads/` — admin dashboard

### Auth
- JWT in httpOnly cookie (`propai_token`)
- `middleware.ts` protects `/admin/*`
- bcrypt password hashing
- Roles: `user`, `agent`, `builder`, `admin`

### Media
- `services/cloudinary.service.ts` — image upload/delete

## Scalability Notes

- **Serverless-safe DB**: Connection caching in `lib/db/mongodb.ts`
- **Service layer**: API routes and Server Actions share logic
- **Embeddings**: `Embedding` model with unique index per entity
- **CRM webhook**: `CRM_WEBHOOK_URL` for external integrations
- **Static fallback**: Site works without MongoDB for demos

## Environment

See `.env.example` for all variables. Health check at `GET /api/health`.
