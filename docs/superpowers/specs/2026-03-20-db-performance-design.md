# DB Performance Fix — Sitemap Query & Search Index

Date: 2026-03-20

## Problem

Two database performance issues identified:

1. `getProducts()` fetches all products with full nested includes (variants + spec2Combinations + productCollections) but is only used in `sitemap.ts`, which needs only 3 fields.
2. Search uses `contains + mode: "insensitive"` (PostgreSQL ILIKE) with no index — causes full table scan on `name`, `description`, and via join on `category.name`.

---

## Fix 1: Lightweight Sitemap Query

**File:** `src/action/product/get.ts`

Add `getProductsForSitemap()` — a new cached server action that selects only what sitemap needs:

```ts
select: {
  id: true,
  updatedAt: true,
  productCollections: {
    take: 1,   // mirror the take:1 in productInclude — only first collection needed
    select: {
      collection: { select: { id: true } }
    }
  }
}
```

`take: 1` on `productCollections` is required — without it, every collection relationship per product is loaded, defeating the purpose of the lightweight query.

**File:** `src/app/sitemap.ts`

Replace `getProducts()` call with `getProductsForSitemap()`. Access pattern in sitemap:
- `p.id` ✓
- `p.updatedAt` ✓
- `p.productCollections.length` ✓
- `p.productCollections[0].collection.id` ✓

No changes to existing `getProducts()` — preserved in case of future use.

---

## Fix 2: pg_trgm GIN Index for Search (Latin/Mixed Queries)

### What pg_trgm actually does

pg_trgm splits text into sequences of 3 consecutive characters and creates a GIN index over them. This accelerates `ILIKE '%query%'` when:
- The query string is **3+ characters long**
- PostgreSQL's planner decides the trigram index is selective enough

**Limitation for Chinese:** Chinese queries of 1–2 characters have no usable trigrams and the index is bypassed entirely (seq scan occurs anyway). For this product catalog size (small to medium), a seq scan on Chinese short-query ILIKE is still fast enough in practice.

**Benefit:** Product name/description searches with queries of 3+ characters (including mixed Chinese+English like "Nike 藍色") will use the GIN index.

**`Category.name`:** Already has a `@unique` B-tree index from the schema. A B-tree index cannot accelerate `ILIKE '%...%'` (leading wildcard). Since category search is a JOIN condition and categories are few in number, the seq scan on category is negligible — no change needed.

### Decision

Add `pg_trgm` extension and GIN indexes on `Product.name` and `Product.description`. Acknowledge that short Chinese-only queries (≤2 chars) are not accelerated, but these are a small subset and the catalog scan is fast at this scale.

### Migration

New Prisma raw migration file:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx"
  ON "Product" USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Product_description_trgm_idx"
  ON "Product" USING GIN (description gin_trgm_ops);
```

Search code in `src/action/search/get.ts` remains **unchanged** — Prisma's `contains + mode: "insensitive"` generates `ILIKE` which automatically uses the GIN index when applicable.

---

## Scope

- No breaking changes
- No API changes
- No UI changes
- One new server action function (`getProductsForSitemap`)
- One Prisma migration (extension + 2 indexes)
