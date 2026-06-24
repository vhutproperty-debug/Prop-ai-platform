# Prop AI Data Ingestion System

Copyright-safe, production-grade data ingestion for structured real estate facts.

> **Homepage is not affected.** Imported data is staged and reviewed before publishing.

## Pipeline Architecture

```
Source → Extraction → Normalization → Validation → Staging → Admin Review → MongoDB
```

| Stage | Location | Purpose |
|-------|----------|---------|
| Source | API / Admin form | Raw structured input |
| Extraction | `lib/extractors/` | Source-specific extractors |
| Normalization | `lib/normalizers/` | Canonical schema mapping |
| Validation | `validations/ingestion*.ts` | Zod validation |
| Staging | `models/ImportRecord` | Pending review queue |
| Review | `app/admin/imports/` | Approve / reject / publish |
| Publish | `lib/importers/publisher.ts` | Write to production collections |

## Supported Sources

### 1. Builder Website (Structured Facts)
- **Input:** JSON with explicitly provided factual fields
- **Copyright-safe:** No HTML scraping, no marketing copy extraction
- **Extractor:** `lib/extractors/website.extractor.ts`

### 2. PDF Brochures
- **Input:** Pre-extracted plain text + optional builder/project names
- **Extracts:** RERA number, possession date, BHK configs, price ranges, amenity keywords
- **Does NOT store:** Marketing prose or creative descriptions
- **Parser:** `lib/parsers/pdf-text.parser.ts`

### 3. Manual Import
- **Input:** Full structured JSON
- **Only source** that allows `description` and `tagline` fields
- **Extractor:** `lib/extractors/manual.extractor.ts`

### 4. CSV Import
- **Input:** CSV string or row array
- **Groups rows** by builder + project + location
- **Parser:** `lib/parsers/csv.parser.ts`

## Stored Fields (Structured Only)

- Builder name, slug
- Project name, slug, location, micro-market
- Configurations (type, BHK, price range, carpet area)
- Price ranges
- Amenities (normalized names)
- Possession date
- RERA number
- Gallery URLs
- Geo coordinates

## Duplicate Detection

`lib/importers/duplicate-detector.ts` checks:

| Match Type | Confidence | Blocking |
|------------|------------|----------|
| Exact slug | 100% | Yes |
| RERA number | 95% | Yes |
| Builder + project pair | 90% | No |
| Staged slug collision | 85% | Yes |
| Builder name match | 80% | No |

## Admin Review Workflow

1. **Run import** → records staged as `staged` or `duplicate`
2. **Admin reviews** at `/admin/imports/[jobId]`
3. **Approve** → status `approved`
4. **Reject** → status `rejected`
5. **Publish** (admin only) → writes to Builder, Location, Project, Configuration, Amenity, Image

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/imports` | admin/agent | List import jobs |
| POST | `/api/admin/imports` | admin/agent | Run ingestion pipeline |
| GET | `/api/admin/imports/[id]` | admin/agent | Job + records |
| POST | `/api/admin/imports/records/[id]` | admin/agent | approve/reject/publish |

### Publish action body:
```json
{ "action": "publish" }
```

## Server Actions

- `runImportAction` — start pipeline
- `approveImportRecordAction` — approve staged record
- `rejectImportRecordAction` — reject record
- `publishImportRecordAction` — publish to MongoDB

## Scalability (30 builders, 1000+ projects)

- Indexed slug, RERA, builder+project compound queries
- Batch CSV imports group rows per project
- Staging table decouples ingestion from production
- `ImportJob` tracks batch metadata and error counts
- Publisher uses upserts — idempotent re-publish safe
- Connection pooling via `lib/db/mongodb.ts`

## Example Manual Import

```json
{
  "source": "manual",
  "payload": {
    "project": {
      "builderName": "Lodha",
      "projectName": "World Towers",
      "locationName": "Lower Parel",
      "microMarket": "Worli-Lower Parel",
      "configurations": [
        {
          "name": "3 BHK Premium",
          "type": "3 BHK",
          "bhk": 3,
          "priceRange": { "min": 45000000, "max": 65000000, "currency": "INR" }
        }
      ],
      "priceRange": { "min": 45000000, "max": 120000000, "currency": "INR" },
      "amenities": ["Swimming Pool", "Gym", "Clubhouse"],
      "reraNumber": "P51900012345",
      "possessionDate": "2027-06-01",
      "gallery": [{ "url": "https://res.cloudinary.com/.../image.jpg" }],
      "status": "ongoing"
    }
  }
}
```

## File Structure

```
lib/
  extractors/     Source-specific extraction
  parsers/        CSV, PDF text parsing
  normalizers/    Canonical schema mapping
  importers/      Pipeline, duplicates, publisher
  ingestion/      Structured logging

models/
  ImportJob.ts    Batch tracking
  ImportRecord.ts Staging + review state

services/
  ingestion.service.ts
  import-review.service.ts

app/admin/imports/  Review UI
```
