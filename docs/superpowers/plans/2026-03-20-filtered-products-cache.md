# Filtered Products Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `unstable_cache` to `getFilteredProductsByCollection` and cache the first page of `getInfiniteFilteredProductsByCollection`.

**Architecture:** Each function's logic is moved into a private `_` prefixed `unstable_cache` wrapper that takes individual args (required for correct cache key serialization). The public exports become thin wrappers. For the infinite scroll function, cursor=undefined routes to the cache; cursor present routes to direct DB query. Both use `tags: [CACHE_TAGS.products, CACHE_TAGS.collections]` since the result embeds collection info.

**Tech Stack:** Next.js 14 `unstable_cache`, Prisma ORM, `CACHE_TAGS` from `@/lib/cache-keys`

**Spec:** `docs/superpowers/specs/2026-03-20-filtered-products-cache-design.md`

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/action/product/get-filtered.ts` — add cache wrapper |
| Modify | `src/action/product/get-filtered-infinite.ts` — add first-page cache, split cursor path |

---

## Task 1: Cache `getFilteredProductsByCollection`

**Files:**
- Modify: `src/action/product/get-filtered.ts`

- [ ] **Step 1: Read the current file**

Read `C:\Users\PEI\Desktop\NEXTJS\ecommerce-peishop-web\src\action\product\get-filtered.ts` to confirm current content before editing.

- [ ] **Step 2: Replace the file with the cached version**

Replace the entire file content with:

```ts
"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { productInclude } from "@/lib/prisma-includes";
import { getCollectionInfo, getAvailableFilters } from "@/lib/cached-queries";
import { CACHE_TAGS } from "@/lib/cache-keys";

// ── 型別定義 ──────────────────────────────────────────────────

export interface ProductFilterParams {
  collectionId: string;
  categorySlug?: string;
  categories?: string[];
  brands?: string[];
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface FilteredProductsResult {
  products: any[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  availableFilters: {
    categories: string[];
    brands: string[];
  };
  collectionInfo: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// ── 主要 action ───────────────────────────────────────────────

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
    try {
      const baseWhere: Prisma.ProductWhereInput = {
        productCollections: {
          some: { collectionId },
        },
      };

      if (categorySlug) {
        const decoded = decodeURIComponent(categorySlug);
        if (decoded !== "全部") {
          baseWhere.category = { name: decoded };
        }
      }

      if (categories.length > 0) {
        baseWhere.category = { name: { in: categories } };
      }

      if (brands.length > 0) {
        baseWhere.brand = { in: brands };
      }

      let orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
      switch (sortBy) {
        case "price-low":   orderBy = [{ price: "asc" }]; break;
        case "price-high":  orderBy = [{ price: "desc" }]; break;
        case "name-asc":    orderBy = [{ name: "asc" }]; break;
        case "name-desc":   orderBy = [{ name: "desc" }]; break;
        case "oldest":      orderBy = [{ createdAt: "asc" }]; break;
        default:            orderBy = [{ createdAt: "desc" }]; break;
      }

      const skip = (page - 1) * limit;

      const [collection, products, totalCount, filters] = await Promise.all([
        getCollectionInfo(collectionId),
        prisma.product.findMany({
          where: baseWhere,
          include: productInclude,
          orderBy,
          skip,
          take: limit,
        }),
        prisma.product.count({ where: baseWhere }),
        getAvailableFilters(collectionId),
      ]);

      if (!collection) {
        throw new Error("Collection not found");
      }

      const totalPages = Math.ceil(totalCount / limit);

      return {
        products,
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        availableFilters: filters,
        collectionInfo: collection,
      };
    } catch (error) {
      console.error("獲取過濾產品錯誤:", error);
      throw error;
    }
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

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/action/product/get-filtered.ts
git commit -m "perf: cache getFilteredProductsByCollection with unstable_cache"
```

---

## Task 2: Cache first page of `getInfiniteFilteredProductsByCollection`

**Files:**
- Modify: `src/action/product/get-filtered-infinite.ts`

- [ ] **Step 1: Read the current file**

Read `C:\Users\PEI\Desktop\NEXTJS\ecommerce-peishop-web\src\action\product\get-filtered-infinite.ts` to confirm current content before editing.

- [ ] **Step 2: Replace the file with the split cached version**

Replace the entire file content with:

```ts
"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { productInclude } from "@/lib/prisma-includes";
import { getCollectionInfo, getAvailableFilters } from "@/lib/cached-queries";
import { CACHE_TAGS } from "@/lib/cache-keys";

export interface InfiniteProductFilterParams {
  collectionId: string;
  categorySlug?: string;
  categories?: string[];
  brands?: string[];
  sortBy?: string;
  cursor?: string;
  limit?: number;
}

export interface InfiniteFilteredProductsResult {
  products: any[];
  nextCursor: string | null;
  hasNextPage: boolean;
  totalCount: number;
  availableFilters: {
    categories: string[];
    brands: string[];
  };
  collectionInfo: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// ── 第一頁快取（無 cursor）────────────────────────────────────

const _getInfiniteFirstPage = unstable_cache(
  async (
    collectionId: string,
    categorySlug: string | undefined,
    categories: string[],
    brands: string[],
    sortBy: string,
    limit: number,
  ): Promise<InfiniteFilteredProductsResult> => {
    try {
      const baseWhere: Prisma.ProductWhereInput = {
        productCollections: {
          some: { collectionId },
        },
      };

      if (categorySlug) {
        const decoded = decodeURIComponent(categorySlug);
        if (decoded !== "全部") {
          baseWhere.category = { name: decoded };
        }
      }

      if (categories.length > 0) {
        baseWhere.category = { name: { in: categories } };
      }

      if (brands.length > 0) {
        baseWhere.brand = { in: brands };
      }

      // orderBy with id tiebreakers preserved for cursor-based pagination stability
      let orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
      switch (sortBy) {
        case "price-low":
          orderBy = [{ price: "asc" }, { id: "asc" }];
          break;
        case "price-high":
          orderBy = [{ price: "desc" }, { id: "desc" }];
          break;
        case "name-asc":
          orderBy = [{ name: "asc" }, { id: "asc" }];
          break;
        case "name-desc":
          orderBy = [{ name: "desc" }, { id: "desc" }];
          break;
        case "oldest":
          orderBy = [{ createdAt: "asc" }, { id: "asc" }];
          break;
        default:
          orderBy = [{ createdAt: "desc" }, { id: "desc" }];
          break;
      }

      const [collection, products, totalCount, filters] = await Promise.all([
        getCollectionInfo(collectionId),
        prisma.product.findMany({
          where: baseWhere,
          include: productInclude,
          orderBy,
          take: limit + 1,
        }),
        prisma.product.count({ where: baseWhere }),
        getAvailableFilters(collectionId),
      ]);

      if (!collection) {
        throw new Error("Collection not found");
      }

      const hasNextPage = products.length > limit;
      const resultProducts = hasNextPage ? products.slice(0, -1) : products;
      const nextCursor =
        hasNextPage && resultProducts.length > 0
          ? resultProducts[resultProducts.length - 1].id
          : null;

      return {
        products: resultProducts,
        nextCursor,
        hasNextPage,
        totalCount,
        availableFilters: filters,
        collectionInfo: collection,
      };
    } catch (error) {
      console.error("獲取無限滾動產品錯誤:", error);
      throw error;
    }
  },
  ["infinite-filtered-products-first"],
  { tags: [CACHE_TAGS.products, CACHE_TAGS.collections], revalidate: 60 },
);

// ── 主要 action ───────────────────────────────────────────────

export async function getInfiniteFilteredProductsByCollection({
  collectionId,
  categorySlug,
  categories = [],
  brands = [],
  sortBy = "newest",
  cursor,
  limit = 12,
}: InfiniteProductFilterParams): Promise<InfiniteFilteredProductsResult> {
  // First page: use cache (all users share the same first page per filter combo)
  if (!cursor) {
    return _getInfiniteFirstPage(
      collectionId,
      categorySlug,
      categories,
      brands,
      sortBy,
      limit,
    );
  }

  // Cursor pages: direct DB query (cursor values are unique per user, cache hit rate ≈ 0)
  try {
    const baseWhere: Prisma.ProductWhereInput = {
      productCollections: {
        some: { collectionId },
      },
    };

    if (categorySlug) {
      const decoded = decodeURIComponent(categorySlug);
      if (decoded !== "全部") {
        baseWhere.category = { name: decoded };
      }
    }

    if (categories.length > 0) {
      baseWhere.category = { name: { in: categories } };
    }

    if (brands.length > 0) {
      baseWhere.brand = { in: brands };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
    switch (sortBy) {
      case "price-low":
        orderBy = [{ price: "asc" }, { id: "asc" }];
        break;
      case "price-high":
        orderBy = [{ price: "desc" }, { id: "desc" }];
        break;
      case "name-asc":
        orderBy = [{ name: "asc" }, { id: "asc" }];
        break;
      case "name-desc":
        orderBy = [{ name: "desc" }, { id: "desc" }];
        break;
      case "oldest":
        orderBy = [{ createdAt: "asc" }, { id: "asc" }];
        break;
      default:
        orderBy = [{ createdAt: "desc" }, { id: "desc" }];
        break;
    }

    baseWhere.id = { lt: cursor };
    orderBy = orderBy.map((order) =>
      "id" in order ? { id: "desc" } : order,
    );
    if (!orderBy.some((order) => "id" in order)) {
      orderBy.push({ id: "desc" });
    }

    const [collection, products, totalCount, filters] = await Promise.all([
      getCollectionInfo(collectionId),
      prisma.product.findMany({
        where: baseWhere,
        include: productInclude,
        orderBy,
        take: limit + 1,
      }),
      prisma.product.count({ where: baseWhere }),
      getAvailableFilters(collectionId),
    ]);

    if (!collection) {
      throw new Error("Collection not found");
    }

    const hasNextPage = products.length > limit;
    const resultProducts = hasNextPage ? products.slice(0, -1) : products;
    const nextCursor =
      hasNextPage && resultProducts.length > 0
        ? resultProducts[resultProducts.length - 1].id
        : null;

    return {
      products: resultProducts,
      nextCursor,
      hasNextPage,
      totalCount,
      availableFilters: filters,
      collectionInfo: collection,
    };
  } catch (error) {
    console.error("獲取無限滾動產品錯誤:", error);
    throw error;
  }
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
git commit -m "perf: cache first page of getInfiniteFilteredProductsByCollection"
```
