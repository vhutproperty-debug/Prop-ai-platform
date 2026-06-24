# Prop AI Data Models

Production-grade Mongoose models for the Prop AI real estate platform.

> **Note:** Homepage UI uses static data from `data/homepage.ts` and is not affected by these models.

See also: [ARCHITECTURE.md](./ARCHITECTURE.md) | [API.md](./API.md)

## Model Overview

| Model | Collection | Purpose |
|-------|------------|---------|
| `Builder` | builders | Developer / builder profiles |
| `Project` | projects | Residential & commercial projects |
| `Configuration` | configurations | Unit types (2 BHK, 3 BHK, etc.) |
| `Amenity` | amenities | Normalized amenity catalog |
| `FAQ` | faqs | Entity-linked FAQs |
| `Location` | locations | Localities & micro-markets |
| `Lead` | leads | CRM lead pipeline |
| `Image` | images | Cloudinary-backed media assets |

## Entity Relationships

```
Builder ──< Project >── Location
              │
              ├──< Configuration
              ├──> Amenity (many-to-many via refs)
              ├──> Image (gallery)
              └──> FAQ

Lead ──> Project | Builder | Location
```

## Project Schema

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `builderId` | ObjectId → Builder | ✓ | Builder reference |
| `builderName` | String | ✓ | Denormalized for search |
| `projectName` | String | ✓ | Display name |
| `slug` | String | ✓ unique | URL slug |
| `location` | ObjectId → Location | ✓ | Primary location |
| `locationName` | String | ✓ | Denormalized locality name |
| `microMarket` | String | ✓ | Sub-locality (e.g. Bandra West) |
| `configurations` | ObjectId[] → Configuration | | Unit configurations |
| `priceRange` | `{ min, max, currency }` | ✓ | Price range in INR |
| `amenities` | ObjectId[] → Amenity | | Linked amenities |
| `gallery` | ObjectId[] → Image | | Project images |
| `reraNumber` | String | ✓ | RERA registration |
| `possessionDate` | Date | ✓ | Expected possession |
| `status` | Enum | ✓ | upcoming \| ongoing \| ready \| sold_out |
| `latitude` | Number | ✓ | Geo coordinate |
| `longitude` | Number | ✓ | Geo coordinate |
| `description` | String | text | Full description |
| `tagline` | String | text | Short tagline |
| `brochure` | String | | Brochure PDF URL |
| `featured` | Boolean | ✓ | Homepage/API featured flag |
| `seoTitle` | String | | SEO title |
| `seoDescription` | String | | SEO meta description |
| `faqs` | ObjectId[] → FAQ | | Linked FAQs |
| `isActive` | Boolean | ✓ | Soft visibility flag |

## Lead Pipeline

```
NEW → CONTACTED → SITE_VISIT → QUOTATION_SENT → NEGOTIATION → WON | LOST
```

## Indexes

Indexes are defined in each model schema and synced via `lib/db/indexes.ts` on connection.

Key compound indexes:
- **Project search**: text index on name, builder, location, microMarket, description
- **Project filters**: `featured + status + isActive`, `priceRange.min/max`
- **Lead CRM**: `status + createdAt`, `assignedTo + status`
- **Location discovery**: `city + microMarket`, `investmentScore + rentalScore`

See `INDEX_DOCUMENTATION` in `lib/db/indexes.ts` for the full list.

## Types

TypeScript interfaces live in `types/models/index.ts`:

```typescript
import type { IProject, IBuilder, ILead } from "@/types/models";
```

## Validation

Zod schemas in `validations/models.ts`:

```typescript
import { projectSchema, leadModelSchema } from "@/validations/models";
```

## Usage

```typescript
import { connectDB } from "@/lib/db";
import { Project, Builder, Location } from "@/models";

await connectDB(); // auto-syncs indexes

const projects = await Project.find({ featured: true, isActive: true })
  .populate("location")
  .populate("configurations")
  .lean();
```

## Legacy Models

| Model | Status |
|-------|--------|
| `Locality` | Deprecated — use `Location` |
| `Embedding` | AI search vectors (unchanged) |
| `User` | Auth (unchanged) |

## File Structure

```
models/
  Builder.ts
  Project.ts
  Configuration.ts
  Amenity.ts
  FAQ.ts
  Location.ts
  Lead.ts
  Image.ts
  index.ts

types/
  models/index.ts
  database.ts

validations/
  models.ts

lib/db/
  mongodb.ts
  indexes.ts
  with-database.ts
  index.ts
```
