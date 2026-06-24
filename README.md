# Prop AI

Mumbai's AI-first real estate operating system. Intelligence, not listings.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Shadcn UI** primitives
- **MongoDB + Mongoose**
- **Server Actions**
- **Zod** validation
- **JWT** authentication
- **Cloudinary** media
- **Framer Motion** animations

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/           Routes, API, admin
actions/       Server Actions
services/      Business logic
models/        Mongoose schemas
validations/   Zod schemas
components/    UI components
docs/          Documentation
scripts/       Database seed
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full architecture.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (webpack) |
| `npm run dev:turbo` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run seed` | Seed MongoDB with sample data |

## API & Admin

- **Health**: `GET /api/health`
- **API docs**: [docs/API.md](docs/API.md)
- **Admin CRM**: `/admin/leads` (requires admin/agent login)
- **Login**: `/login`

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Vercel deployment guide.

## Phase 1 Scope

- Premium homepage (11 sections)
- Static data with MongoDB fallback
- Project, locality, builder detail pages
- AI search architecture (keyword + embedding-ready)
- Lead capture + CRM admin
- JWT-ready authentication

## License

Private — Prop AI
