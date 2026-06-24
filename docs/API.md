# Prop AI API Reference

Base URL: `http://localhost:3000` (development)

All responses follow:

```json
{
  "success": true,
  "data": {}
}
```

Error responses:

```json
{
  "success": false,
  "error": "Message",
  "details": {}
}
```

---

## Health

### `GET /api/health`

Returns service configuration status.

---

## Auth

### `POST /api/auth/register`

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "phone": "+919876543210"
}
```

### `POST /api/auth/login`

```json
{
  "email": "admin@propai.in",
  "password": "your-password"
}
```

Sets `propai_token` httpOnly cookie.

### `GET /api/auth/me`

Returns current session user or `null`.

---

## Catalog

### `GET /api/projects`

Query params: `featured`, `status`, `locality`, `builder`, `page`, `limit`

### `GET /api/localities`

Returns all localities (DB or static fallback).

### `GET /api/builders`

Returns all builders (DB or static fallback).

---

## Search

### `POST /api/search`

```json
{
  "query": "3 BHK in Bandra under 5 Cr",
  "limit": 5,
  "mode": "hybrid"
}
```

Modes: `keyword`, `semantic`, `hybrid`

---

## Leads (CRM)

### `POST /api/leads`

Public lead capture.

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+919876543210",
  "source": "website",
  "query": "Looking for 2 BHK in Powai"
}
```

### `GET /api/leads`

**Auth required** (admin/agent). Query: `status`, `search`, `page`, `limit`

### `GET /api/leads/export`

**Auth required** (admin/agent). Returns CSV download.

---

## Server Actions

| Action | File | Purpose |
|--------|------|---------|
| `createLeadAction` | `actions/leads.ts` | Create lead |
| `updateLeadAction` | `actions/leads.ts` | Update status/notes |
| `deleteLeadAction` | `actions/leads.ts` | Delete lead |
| `loginAction` | `actions/auth.ts` | Sign in |
| `registerAction` | `actions/auth.ts` | Sign up |
| `searchAction` | `actions/search.ts` | AI search |

---

## Lead Pipeline Statuses

`NEW` → `CONTACTED` → `SITE_VISIT` → `QUOTATION_SENT` → `NEGOTIATION` → `WON` / `LOST`
