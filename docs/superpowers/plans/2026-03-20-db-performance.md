# DB Performance Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two DB performance issues — reduce sitemap query payload and add trigram indexes for product search.

**Architecture:** Two independent changes: (1) a new lightweight server action for sitemap.ts, (2) a raw SQL migration that enables pg_trgm and adds GIN indexes on Product.name and Product.description. No business logic changes.

**Tech Stack:** Next.js 14 App Router, Prisma ORM, Neon (PostgreSQL), `unstable_cache`

**Spec:** `docs/superpowers/specs/2026-03-20-db-performance-design.md`

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/action/product/get.ts` — add `getProductsForSitemap()` |
| Modify | `src/app/sitemap.ts` — use `getProductsForSitemap()` |
| Create | `prisma/sql/trgm_indexes.sql` — raw SQL for extension + indexes (applied via `prisma db execute`, not managed migrations) |

---

## Task 1: Add `getProductsForSitemap()`

**Files:**
- Modify: `src/action/product/get.ts`

- [ ] **Step 1: Add the function at the bottom of `get.ts`**

Append after line 113 (after `getProductIds`):

```ts
// ── getProductsForSitemap ─────────────────────────────────────

const _getProductsForSitemap = unstable_cache(
  async () => {
    return prisma.product.findMany({
      select: {
        id: true,
        updatedAt: true,
        productCollections: {
          take: 1,
          select: {
            collection: { select: { id: true } },
          },
        },
      },
    });
  },
  ["products-for-sitemap"],
  { tags: [CACHE_TAGS.products], revalidate: 300 }, // consistent with other product caches in this file
);

export async function getProductsForSitemap() {
  try {
    return await _getProductsForSitemap();
  } catch (error) {
    console.log("商品 sitemap 獲取錯誤", error);
    return [];
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `get.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/action/product/get.ts
git commit -m "perf: add getProductsForSitemap with minimal select"
```

---

## Task 2: Update `sitemap.ts` to use the new function

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Update the import**

In `src/app/sitemap.ts`, change line 3:

```ts
// Before
import { getProducts } from "@/action/product";

// After
import { getProductsForSitemap } from "@/action/product";
```

- [ ] **Step 2: Update the call site**

Change line 10:

```ts
// Before
getProducts().then((p) => p ?? []),

// After
getProductsForSitemap(),
```

The `?? []` fallback is no longer needed — `getProductsForSitemap` already returns `[]` on error.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. The shape returned (`{ id, updatedAt, productCollections: [{ collection: { id } }] }`) satisfies all access patterns in `sitemap.ts` lines 28–38.

- [ ] **Step 4: Manual check — visit sitemap**

Start dev server and open `http://localhost:3000/sitemap.xml`. Confirm product URLs appear correctly.

- [ ] **Step 5: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "perf: use getProductsForSitemap in sitemap.ts"
```

---

## Task 3: Add pg_trgm indexes via raw SQL migration

**Files:**
- Create: `prisma/sql/trgm_indexes.sql`

No Prisma schema changes needed — this is extension + index only.

> **Note:** This file lives in `prisma/sql/` (not `prisma/migrations/`) because it is applied manually via `prisma db execute`. Placing it inside `prisma/migrations/` would conflict with Prisma's timestamp-prefixed managed migration naming convention.

- [ ] **Step 1: Create migration file**

Create `prisma/sql/trgm_indexes.sql`:

```sql
-- Enable trigram extension (requires superuser or pg_extension privilege on Neon)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram index on Product name (accelerates ILIKE '%query%' for 3+ char queries)
-- Note: GIN indexes do not index NULL values; if name ever becomes nullable, NULLs are silently excluded
CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx"
  ON "Product" USING GIN (name gin_trgm_ops);

-- GIN trigram index on Product description
-- Note: same NULL caveat as above
CREATE INDEX IF NOT EXISTS "Product_description_trgm_idx"
  ON "Product" USING GIN (description gin_trgm_ops);
```

- [ ] **Step 2: Execute against Neon DB**

```bash
npx prisma db execute --file prisma/sql/trgm_indexes.sql --schema prisma/schema.prisma
```

Expected output: command completes without error.

> **Note:** If you get a permission error on `CREATE EXTENSION`, log into Neon console → your database → SQL Editor and run `CREATE EXTENSION IF NOT EXISTS pg_trgm;` manually as the superuser, then re-run the command above.

- [ ] **Step 3: Verify indexes exist**

Connect to Neon SQL Editor and run:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Product'
ORDER BY indexname;
```

Expected: rows with `Product_name_trgm_idx` and `Product_description_trgm_idx` both using `GIN`.

- [ ] **Step 4: Commit migration file**

```bash
git add prisma/sql/trgm_indexes.sql
git commit -m "perf: add pg_trgm GIN indexes on Product name and description"
```

---

## Task 4: Manual end-to-end verification

- [ ] **Step 1: Test search with a 3+ char query**

Open `http://localhost:3000/search?q=Nike` (or any 3+ char term). Confirm results return correctly.

- [ ] **Step 2: Test search with a Chinese query**

Open `http://localhost:3000/search?q=藍色`. Confirm results return (index may not be used for 2-char query, but results must still be correct via seq scan).

- [ ] **Step 3: Confirm no regressions on sitemap**

Re-open `http://localhost:3000/sitemap.xml`. Confirm product and collection URLs still present.

- [ ] **Step 4: Final commit (if any cleanup needed)**

```bash
git add -p
git commit -m "perf: db query and search index improvements"
```
