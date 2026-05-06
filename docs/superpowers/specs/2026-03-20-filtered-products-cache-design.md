# Filtered Products Cache Design

Date: 2026-03-20

## Problem

`getFilteredProductsByCollection` and `getInfiniteFilteredProductsByCollection` run fresh DB queries on every request. `getCollectionInfo` and `getAvailableFilters` inside them are already cached, but the product `findMany` and `count` queries are not.

## Approach

Wrap each function's inner logic with `unstable_cache`. `unstable_cache` serializes function arguments into the cache key, so each unique param combination gets its own cache slot.

**Tags:** Both `CACHE_TAGS.products` AND `CACHE_TAGS.collections` — the cached result embeds `collectionInfo` and `availableFilters`, so it must be invalidated when either products or collections change. Using only `CACHE_TAGS.products` would cause stale collection names/filter lists after a collection update.

**`revalidate: 60`** — shorter than other caches (300s) because filter combinations create many cache entries.

For the infinite scroll function, only the first page (`cursor === undefined`) is cached — cursor values are user-specific UUIDs with near-zero cache hit rate on subsequent pages.

## Changes

### `src/action/product/get-filtered.ts`

**Add imports:**
```ts
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-keys";
```

**Restructure:** Extract existing function body into a private `_getFilteredProductsByCollection` wrapped with `unstable_cache`. The public export becomes a thin wrapper that passes individual params (not an object) — `unstable_cache` requires individual arguments for correct cache key serialization.

```ts
const _getFilteredProductsByCollection = unstable_cache(
  async (
    collectionId: string,
    categorySlug: string | undefined,
    categories: string[],
    brands: string[],
    sortBy: string,
    page: number,
    limit: number,
  ): Promise<FilteredProductsResult> => {
    // existing query logic (unchanged) — try/catch + throw stays here
  },
  ["filtered-products"],
  { tags: [CACHE_TAGS.products, CACHE_TAGS.collections], revalidate: 60 },
);

export async function getFilteredProductsByCollection({
  collectionId,
  categorySlug,
  categories = [],
  brands = [],
  sortBy = "newest",
  page = 1,
  limit = 12,
}: ProductFilterParams): Promise<FilteredProductsResult> {
  return _getFilteredProductsByCollection(
    collectionId,
    categorySlug,
    categories,
    brands,
    sortBy,
    page,
    limit,
  );
}
```

The error handling (`try/catch` + `throw`) stays inside the cached inner function. Note: `unstable_cache` does not cache thrown exceptions — a request that throws (e.g. collection not found) will always re-hit the DB. This is correct behavior.

### `src/action/product/get-filtered-infinite.ts`

**Add imports:**
```ts
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-keys";
```

**Restructure:** Extract the first-page path (no cursor) into `_getInfiniteFirstPage` wrapped with `unstable_cache`. The public function routes: no cursor → cached, has cursor → existing direct logic.

The `_getInfiniteFirstPage` body contains the **full** `orderBy` switch with `id` tiebreakers (e.g. `[{ createdAt: "desc" }, { id: "desc" }]`) — these are required for cursor-based pagination stability and must NOT be stripped. The only omission vs. the full function is the cursor block (`baseWhere.id = { lt: cursor }` and related `orderBy` mutation at lines 89–97 of the current file).

```ts
const _getInfiniteFirstPage = unstable_cache(
  async (
    collectionId: string,
    categorySlug: string | undefined,
    categories: string[],
    brands: string[],
    sortBy: string,
    limit: number,
  ): Promise<InfiniteFilteredProductsResult> => {
    // Same as current function body BUT without the cursor block (lines 89-97).
    // orderBy switch is preserved verbatim including id tiebreakers.
    // try/catch + throw stays here.
  },
  ["infinite-filtered-products-first"],
  { tags: [CACHE_TAGS.products, CACHE_TAGS.collections], revalidate: 60 },
);

export async function getInfiniteFilteredProductsByCollection({
  collectionId,
  categorySlug,
  categories = [],
  brands = [],
  sortBy = "newest",
  cursor,
  limit = 12,
}: InfiniteProductFilterParams): Promise<InfiniteFilteredProductsResult> {
  if (!cursor) {
    return _getInfiniteFirstPage(
      collectionId, categorySlug, categories, brands, sortBy, limit,
    );
  }
  // existing cursor-based logic (unchanged, no cache)
}
```

## Cache Keys

| Function | Cache key | Tags | Scope |
|----------|-----------|------|-------|
| `getFilteredProductsByCollection` | `["filtered-products"]` + 7 params | products + collections | Per unique filter+sort+page combo |
| `getInfiniteFilteredProductsByCollection` (first page) | `["infinite-filtered-products-first"]` + 6 params | products + collections | Per unique filter+sort combo, first page only |

## Notes

- Array params (`categories[]`, `brands[]`) are serialized order-sensitively. `["Nike","Adidas"]` and `["Adidas","Nike"]` produce different cache keys. This is an accepted trade-off for a small product catalog. For large catalogs with many filter values (10+), array explosion could be a concern.
- The public function signatures and return types are **unchanged** — no call-site changes needed.
- Cursor-based pages in infinite scroll are never cached — direct DB query every time.

## Scope

- Two files modified: `get-filtered.ts`, `get-filtered-infinite.ts`
- No breaking changes, no API changes, no UI changes
