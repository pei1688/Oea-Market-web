# Cursor Sort Direction Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix cursor pagination in `getInfiniteFilteredProductsByCollection` so ascending sorts use `id > cursor` / `id: "asc"` instead of always using the DESC variants.

**Architecture:** Single targeted edit — replace the 5-line cursor block (lines 200–206) in `src/action/product/get-filtered-infinite.ts` with direction-aware logic derived from `sortBy`. `_getInfiniteFirstPage` (cached, no cursor) is untouched.

**Tech Stack:** Prisma ORM, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-20-cursor-sort-fix-design.md`

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/action/product/get-filtered-infinite.ts` — cursor block only (lines 200–206) |

---

## Task 1: Fix cursor sort direction

**Files:**
- Modify: `src/action/product/get-filtered-infinite.ts`

- [ ] **Step 1: Read the current file**

Read `src/action/product/get-filtered-infinite.ts` lines 195–210 to confirm the cursor block is exactly:

```ts
    baseWhere.id = { lt: cursor };
    orderBy = orderBy.map((order) =>
      "id" in order ? { id: "desc" } : order,
    );
    if (!orderBy.some((order) => "id" in order)) {
      orderBy.push({ id: "desc" });
    }
```

- [ ] **Step 2: Replace the cursor block**

Replace those 7 lines with:

```ts
    const isAscending = ["price-low", "name-asc", "oldest"].includes(sortBy);
    baseWhere.id = isAscending ? { gt: cursor } : { lt: cursor };
    orderBy = orderBy.map((order) =>
      "id" in order ? { id: isAscending ? "asc" : "desc" } : order,
    );
    if (!orderBy.some((order) => "id" in order)) {
      orderBy.push({ id: isAscending ? "asc" : "desc" });
    }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/action/product/get-filtered-infinite.ts
git commit -m "fix: direction-aware cursor condition for ascending sorts in infinite scroll"
```
