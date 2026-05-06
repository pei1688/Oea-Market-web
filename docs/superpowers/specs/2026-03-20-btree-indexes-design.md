# B-tree Index Fix — Missing Product Sort/Filter Indexes

Date: 2026-03-20

## Problem

Four `Product` fields are used in filter/sort queries but have no database index:

| Field | Usage | Location |
|-------|-------|----------|
| `createdAt` | `orderBy: { createdAt: "desc" }` (default sort) | `get-filtered.ts`, `get-filtered-infinite.ts` |
| `price` | `orderBy: { price: "asc/desc" }` | same |
| `name` | `orderBy: { name: "asc/desc" }` | same |
| `brand` | `where: { brand: { in: brands } }` | same |

Without indexes, every filter/sort query on the collection page causes a full table scan on `Product`.

## Approach

**Dual-track:** add `@@index` to `prisma/schema.prisma` so the schema stays as the source of truth, plus a raw SQL file applied via `prisma db execute` to actually create the indexes on Neon.

This is consistent with the pg_trgm work already done in `prisma/sql/trgm_indexes.sql`.

## Index Design

`get-filtered-infinite.ts` always pairs the primary sort field with `id` as a tiebreaker for stable cursor pagination (e.g. `ORDER BY createdAt DESC, id DESC`). A compound index on `(sort_field, id)` serves both this composite sort and the single-column `ORDER BY sort_field` used in `get-filtered.ts` (the compound index's leading column is sufficient for single-column queries). Therefore compound indexes are used for sort fields instead of single-column ones.

`brand` is used only in a `WHERE` filter (not in `ORDER BY`), so it remains single-column.

## Schema Changes

Add to `Product` model in `prisma/schema.prisma`, after the existing `@@index([categoryId])`:

```prisma
@@index([createdAt, id])
@@index([price, id])
@@index([name, id])
@@index([brand])
```

## SQL File

Create `prisma/sql/btree_indexes.sql`:

```sql
-- Compound B-tree indexes for sort fields (support both ORDER BY sort_field and ORDER BY sort_field, id)
CREATE INDEX IF NOT EXISTS "Product_createdAt_id_idx" ON "Product" ("createdAt", id);
CREATE INDEX IF NOT EXISTS "Product_price_id_idx"     ON "Product" (price, id);
CREATE INDEX IF NOT EXISTS "Product_name_id_idx"      ON "Product" (name, id);

-- Single B-tree index for brand filter (WHERE brand IN (...))
CREATE INDEX IF NOT EXISTS "Product_brand_idx"        ON "Product" (brand);
```

Note: `createdAt` is a mixed-case column name and must be double-quoted in SQL. `price`, `name`, `brand`, and `id` are lowercase and do not require quoting.

All four use `CREATE INDEX IF NOT EXISTS` (idempotent).

## Notes

**`name` already has a GIN trigram index** (`Product_name_trgm_idx`) for ILIKE search. GIN indexes are not used for ORDER BY. The new B-tree compound index on `(name, id)` serves `ORDER BY name` queries and does not conflict with the GIN index.

**`brand` is nullable** (`String?`). PostgreSQL B-tree indexes include NULL entries, so the index is used for `brand IS NULL`, `brand = 'X'`, and `brand IN (...)` queries. No special handling needed.

## No Code Changes

Query logic in `get-filtered.ts` and `get-filtered-infinite.ts` is unchanged — PostgreSQL planner picks up the indexes automatically.

## Scope

- Two files changed: `prisma/schema.prisma`, new `prisma/sql/btree_indexes.sql`
- No breaking changes
- No API or UI changes
