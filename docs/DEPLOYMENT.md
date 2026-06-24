# Prop AI Deployment Guide (Vercel)

## Prerequisites

- MongoDB Atlas cluster (or compatible MongoDB host)
- Cloudinary account (optional, for media uploads)
- Vercel account

## 1. Environment Variables

Set these in Vercel Project Settings → Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Min 32 characters, random string |
| `NEXT_PUBLIC_APP_URL` | Yes | Production URL (e.g. `https://propai.in`) |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |
| `OPENAI_API_KEY` | No | Enables semantic embeddings |
| `CRM_WEBHOOK_URL` | No | Lead notification webhook |

## 2. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel

# Production deploy
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

## 3. Seed Database

After first deploy, run locally against production DB:

```bash
cp .env.example .env.local
# Fill in MONGODB_URI and JWT_SECRET

npm run seed
```

Default admin: `admin@propai.in` / `PropAI@Admin123` (change immediately).

## 4. Post-Deploy Checklist

- [ ] `GET /api/health` returns all services configured
- [ ] Homepage loads at `/`
- [ ] Admin login works at `/login`
- [ ] Lead management at `/admin/leads`
- [ ] `POST /api/leads` creates records
- [ ] Change default admin password

## 5. MongoDB Atlas Tips

- Whitelist `0.0.0.0/0` for Vercel serverless (or use Atlas VPC peering)
- Use `mongoose` connection caching (already configured)
- Create indexes: Lead `status`, `email`, `phone`; Project `slug`

## 6. Performance

- Homepage is statically rendered (no DB required)
- API routes use DB with static fallback
- Images served via Next.js Image Optimization + Cloudinary

## 7. Monitoring

- Vercel Analytics (optional)
- Health endpoint for uptime checks
- CRM webhook logs in Vercel function logs
