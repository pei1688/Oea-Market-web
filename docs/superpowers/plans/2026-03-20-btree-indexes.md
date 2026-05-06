# B-tree Index Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add compound B-tree indexes on Product sort fields and a single-column index on brand to speed up collection filter/sort queries.

**Architecture:** Two-part change — update `prisma/schema.prisma` with `@@index` declarations so the schema reflects DB state, then apply the actual indexes to Neon via a raw SQL file using `prisma db execute`. No query code changes needed; PostgreSQL planner uses the indexes automatically.

**Tech Stack:** Prisma ORM, Neon (PostgreSQL), raw SQL via `prisma db execute`

**Spec:** `docs/superpowers/specs/2026-03-20-btree-indexes-design.md`

---

## File Map

| Action | File |
|--------|------|
| Modify | `prisma/schema.prisma` — add 4 `@@index` directives to Product model |
| Create | `prisma/sql/btree_indexes.sql` — idempotent SQL to create indexes on Neon |

---

## Task 1: Update Prisma schema with index declarations

**Files:**
- Modify: `prisma/schema.prisma`

The Product model currently ends with:
```prisma
  @@index([categoryId])
  @@map("Product")
```

- [ ] **Step 1: Add the four index declarations**

In `prisma/schema.prisma`, insert after the `@@index([categoryId])` line and before `@@map("Product")`:

```prisma
  @@index([createdAt, id])
  @@index([price, id])
  @@index([name, id])
  @@index([brand])
```

The full block should look like:
```prisma
  @@index([categoryId])
  @@index([createdAt, id])
  @@index([price, id])
  @@index([name, id])
  @@index([brand])
  @@map("Product")
```

- [ ] **Step 2: Verify schema is valid**

```bash
npx prisma validate
```

Expected: `The schema at prisma/schema.prisma is valid`

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "perf: add compound and brand indexes to Product schema"
```

---

## Task 2: Create SQL file and apply indexes to Neon

**Files:**
- Create: `prisma/sql/btree_indexes.sql`

- [ ] **Step 1: Create the SQL file**

Create `prisma/sql/btree_indexes.sql` with this exact content:

```sql
-- Compound B-tree indexes for sort fields
-- (support both ORDER BY sort_field and ORDER BY sort_field, id used in infinite scroll)
CREATE INDEX IF NOT EXISTS "Product_createdAt_id_idx" ON "Product" ("createdAt", id);
CREATE INDEX IF NOT EXISTS "Product_price_id_idx"     ON "Product" (price, id);
CREATE INDEX IF NOT EXISTS "Product_name_id_idx"      ON "Product" (name, id);

-- Single B-tree index for brand filter (WHERE brand IN (...))
CREATE INDEX IF NOT EXISTS "Product_brand_idx"        ON "Product" (brand);
```

> **Important:** `"createdAt"` must be double-quoted in SQL because it is a mixed-case column name. `price`, `name`, `brand`, and `id` are lowercase and do not require quoting.

- [ ] **Step 2: Apply indexes to Neon**

```bash
npx prisma db execute --file prisma/sql/btree_indexes.sql --schema prisma/schema.prisma
```

Expected: command completes without error.

- [ ] **Step 3: Verify indexes exist**

Connect to Neon SQL Editor and run:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Product'
ORDER BY indexname;
```

Expected: rows for `Product_brand_idx`, `Product_createdAt_id_idx`, `Product_name_id_idx`, `Product_price_id_idx` — all using `btree`.

- [ ] **Step 4: Commit**

```bash
git add prisma/sql/btree_indexes.sql
git commit -m "perf: add pg B-tree indexes for Product sort and filter fields"
```
