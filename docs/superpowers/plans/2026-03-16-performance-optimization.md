# Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 降低 DB 查詢次數、加入 Next.js `unstable_cache` 快取層，改善電商網站載入速度。

**Architecture:** 所有 read Server Action 都透過私有 `unstable_cache` 函式委派 DB 查詢，public exported function 保持 server action 語意不變。重複的 DB 查詢（availableFilters）拆成獨立快取函式；search 的序列查詢改為平行。

**Tech Stack:** Next.js 15 App Router, Prisma ORM, TypeScript, Vercel, `unstable_cache` from `next/cache`

**Spec:** `docs/superpowers/specs/2026-03-16-performance-optimization-design.md`

---

## File Map

| 檔案 | 類型 | 負責內容 |
|------|------|---------|
| `src/lib/cache-keys.ts` | 新增 | Cache tag 字串常數，避免 typo |
| `src/lib/prisma-includes.ts` | 新增 | 統一 `productInclude` 型別安全常數 |
| `src/action/product/get.ts` | 修改 | product read actions + unstable_cache |
| `src/action/collection/get.ts` | 修改 | collection read actions + unstable_cache |
| `src/action/product/get-filtered.ts` | 修改 | 拆 availableFilters、flat Promise.all |
| `src/action/product/get-filtered-infinite.ts` | 修改 | 拆 availableFilters、flat Promise.all |
| `src/action/search/get.ts` | 修改 | findMany + count 改 Promise.all |
| `src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx` | 修改 | generateStaticParams 改用快取 action |
| `next.config.ts` | 修改 | minimumCacheTTL 60 → 3600 |

---

## Chunk 1: 建立共用基礎設施

### Task 1: 新增 `src/lib/cache-keys.ts`

**Files:**
- Create: `src/lib/cache-keys.ts`

- [ ] **Step 1: 建立 cache tag 常數檔**

```ts
// src/lib/cache-keys.ts
export const CACHE_TAGS = {
  products: "products",
  collections: "collections",
} as const;
```

- [ ] **Step 2: 確認 TypeScript 編譯通過**

```bash
pnpm tsc --noEmit
```

Expected: 無新增錯誤

- [ ] **Step 3: Commit**

```bash
git add src/lib/cache-keys.ts
git commit -m "feat: add cache tag constants"
```

---

### Task 2: 新增 `src/lib/prisma-includes.ts`

**Files:**
- Create: `src/lib/prisma-includes.ts`

- [ ] **Step 1: 建立統一的 productInclude**

```ts
// src/lib/prisma-includes.ts
import { Prisma } from "@prisma/client";

export const productInclude = {
  category: true,
  variants: {
    include: {
      spec2Combinations: true,
    },
  },
} as const satisfies Prisma.ProductInclude;
```

- [ ] **Step 2: 確認 TypeScript 編譯通過**

```bash
pnpm tsc --noEmit
```

Expected: 無新增錯誤（`satisfies Prisma.ProductInclude` 若型別不符會在此報錯）

- [ ] **Step 3: Commit**

```bash
git add src/lib/prisma-includes.ts
git commit -m "feat: add shared productInclude with Prisma type safety"
```

---

## Chunk 2: 商品 Action 快取

### Task 3: 修改 `src/action/product/get.ts`

**Files:**
- Modify: `src/action/product/get.ts`

> **背景：** 此檔案有 5 個 exported function。`getRelatedProducts` 因為用了 `Math.random()` **不能快取**，維持現狀。其餘 4 個都套 `unstable_cache` 私有函式模式。
>
> **模式：** `unstable_cache` 包私有函式（`_fnName`），public exported function 委派給它。`unstable_cache` 會自動把函式參數納入 cache key，keyParts 只需固定前綴。

- [ ] **Step 1: 替換整個檔案內容**

將 `src/action/product/get.ts` 改為：

```ts
"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { productInclude } from "@/lib/prisma-includes";
import { CACHE_TAGS } from "@/lib/cache-keys";

// ── getProducts ──────────────────────────────────────────────

const _getProducts = unstable_cache(
  async () => {
    return prisma.product.findMany({ include: productInclude });
  },
  ["products"],
  { tags: [CACHE_TAGS.products], revalidate: 300 }
);

export async function getProducts() {
  try {
    return await _getProducts();
  } catch (error) {
    console.log("商品獲取錯誤", error);
  }
}

// ── getRelatedProducts ───────────────────────────────────────
// 不快取：內部使用 Math.random()，快取會凍結隨機結果

export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 4,
) {
  const totalProducts = await prisma.product.count({
    where: {
      categoryId,
      NOT: { id: excludeProductId },
    },
  });

  const skip = Math.max(0, Math.floor(Math.random() * (totalProducts - limit)));

  const related = await prisma.product.findMany({
    where: {
      categoryId,
      NOT: { id: excludeProductId },
    },
    skip,
    take: limit,
    include: productInclude,
  });

  return related;
}

// ── getProduct ───────────────────────────────────────────────

const _getProduct = unstable_cache(
  async (productId: string) => {
    return prisma.product.findUnique({
      where: { id: productId },
      include: productInclude,
    });
  },
  ["product"],
  { tags: [CACHE_TAGS.products], revalidate: 300 }
);

export async function getProduct(productId: string) {
  try {
    return await _getProduct(productId);
  } catch (error) {
    console.log("商品獲取錯誤", error);
  }
}

// ── getProductsByCollectionId ────────────────────────────────

const _getProductsByCollectionId = unstable_cache(
  async (collectionId: string) => {
    return prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        productCollections: {
          include: {
            product: { include: productInclude },
          },
        },
      },
    });
  },
  ["products-by-collection"],
  { tags: [CACHE_TAGS.products], revalidate: 300 }
);

export async function getProductsByCollectionId(collectionId: string) {
  return _getProductsByCollectionId(collectionId);
}

// ── getProductIds ─────────────────────────────────────────────

const _getProductIds = unstable_cache(
  async () => {
    return prisma.product.findMany({ select: { id: true } });
  },
  ["product-ids"],
  { tags: [CACHE_TAGS.products], revalidate: 300 }
);

export async function getProductIds() {
  return _getProductIds();
}
```

- [ ] **Step 2: 確認 TypeScript 編譯通過**

```bash
pnpm tsc --noEmit
```

Expected: 無新增錯誤

- [ ] **Step 3: Commit**

```bash
git add src/action/product/get.ts
git commit -m "feat: add unstable_cache to product read actions"
```

---

### Task 4: 修改 `src/action/collection/get.ts`

**Files:**
- Modify: `src/action/collection/get.ts`

> **背景：** 3 個 collection read action 全部套快取，revalidate 600 秒，tag `collections`。

- [ ] **Step 1: 替換整個檔案內容**

將 `src/action/collection/get.ts` 改為：

```ts
"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-keys";

// ── getCollectionById ─────────────────────────────────────────

const _getCollectionById = unstable_cache(
  async (collectionId: string) => {
    return prisma.collection.findUnique({
      where: { id: collectionId },
      select: {
        id: true,
        name: true,
        productCollections: {
          select: {
            id: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imgUrl: true,
                isOnSale: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },
  ["collection-by-id"],
  { tags: [CACHE_TAGS.collections], revalidate: 600 }
);

export async function getCollectionById(collectionId: string) {
  try {
    return await _getCollectionById(collectionId);
  } catch (error) {
    console.log("合集獲取錯誤", error);
    return null;
  }
}

// ── getCollections ────────────────────────────────────────────

const _getCollections = unstable_cache(
  async () => {
    return prisma.collection.findMany({
      include: {
        productCollections: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imgUrl: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },
  ["collections"],
  { tags: [CACHE_TAGS.collections], revalidate: 600 }
);

export async function getCollections() {
  try {
    return await _getCollections();
  } catch (error) {
    console.log("合集獲取錯誤", error);
    return [];
  }
}

// ── getCollectionsWithCategory ────────────────────────────────

const _getCollectionsWithCategory = unstable_cache(
  async () => {
    return prisma.collection.findMany({
      include: {
        productCollections: {
          select: {
            product: {
              select: {
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },
  ["collections-with-category"],
  { tags: [CACHE_TAGS.collections], revalidate: 600 }
);

export async function getCollectionsWithCategory() {
  try {
    return await _getCollectionsWithCategory();
  } catch (error) {
    console.log("合集獲取錯誤", error);
    return [];
  }
}
```

- [ ] **Step 2: 確認 TypeScript 編譯通過**

```bash
pnpm tsc --noEmit
```

Expected: 無新增錯誤

- [ ] **Step 3: Commit**

```bash
git add src/action/collection/get.ts
git commit -m "feat: add unstable_cache to collection read actions"
```

---

## Chunk 3: DB Query 修正

### Task 5: 新增 `src/lib/cached-queries.ts` + 修改 `src/action/product/get-filtered.ts`

**Files:**
- Create: `src/lib/cached-queries.ts`
- Modify: `src/action/product/get-filtered.ts`

> **背景：** 目前每次呼叫都執行 3 個 DB 查詢（collection info、products+count、allProductsInCollection）。
> 改為：
> 1. `getCollectionInfo` — 共用快取函式（存在 `cached-queries.ts`），只撈 `{ id, name, slug }`
> 2. `getAvailableFilters` — 共用快取函式（存在 `cached-queries.ts`），撈分類+品牌清單
> 3. 主查詢（products + count）仍直接打 DB（帶 filter/sort/page 參數，快取命中率低）
> 4. 四者用 flat `Promise.all` 平行執行
>
> **注意：** `cached-queries.ts` 必須先建立，`get-filtered.ts` 才能 import，因此兩個步驟合在同一個 Task 中。

- [ ] **Step 1: 建立 `src/lib/cached-queries.ts`**

```ts
// src/lib/cached-queries.ts
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-keys";

export const getCollectionInfo = unstable_cache(
  async (collectionId: string) => {
    return prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true, name: true, slug: true },
    });
  },
  ["collection-info"],
  { tags: [CACHE_TAGS.collections], revalidate: 600 }
);

export const getAvailableFilters = unstable_cache(
  async (collectionId: string) => {
    const allProducts = await prisma.product.findMany({
      where: {
        productCollections: {
          some: { collectionId },
        },
      },
      select: {
        category: { select: { name: true } },
        brand: true,
      },
    });

    const categories = Array.from(
      new Set(allProducts.map((p) => p.category.name))
    );
    const brands = Array.from(
      new Set(
        allProducts
          .map((p) => p.brand)
          .filter((b): b is string => Boolean(b))
      )
    );

    return { categories, brands };
  },
  ["available-filters"],
  { tags: [CACHE_TAGS.collections], revalidate: 600 }
);
```

- [ ] **Step 2: 替換 `src/action/product/get-filtered.ts` 整個檔案**

```ts
"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { productInclude } from "@/lib/prisma-includes";
import { getCollectionInfo, getAvailableFilters } from "@/lib/cached-queries";

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

export async function getFilteredProductsByCollection({
  collectionId,
  categorySlug,
  categories = [],
  brands = [],
  sortBy = "newest",
  page = 1,
  limit = 12,
}: ProductFilterParams): Promise<FilteredProductsResult> {
  try {
    // 構建過濾條件
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

    // 排序
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

    // 四個查詢完全平行執行
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
}
```

- [ ] **Step 3: 確認 TypeScript 編譯通過**

```bash
pnpm tsc --noEmit
```

Expected: 無新增錯誤

- [ ] **Step 4: Commit**

```bash
git add src/lib/cached-queries.ts src/action/product/get-filtered.ts
git commit -m "perf: extract shared cached queries, flatten Promise.all in get-filtered"
```

---

### Task 6: 修改 `src/action/product/get-filtered-infinite.ts`

**Files:**
- Modify: `src/action/product/get-filtered-infinite.ts`

> **背景：** 與 Task 5 相同問題。直接 import `getCollectionInfo` 和 `getAvailableFilters` 來自已建立的 `@/lib/cached-queries`（Task 5 已建立）。

- [ ] **Step 1: 替換 `get-filtered-infinite.ts` 整個檔案**

```ts
"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { productInclude } from "@/lib/prisma-includes";
import { getCollectionInfo, getAvailableFilters } from "@/lib/cached-queries";

// ── 型別定義 ──────────────────────────────────────────────────

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
      case "price-low":   orderBy = [{ price: "asc" }, { id: "asc" }]; break;
      case "price-high":  orderBy = [{ price: "desc" }, { id: "desc" }]; break;
      case "name-asc":    orderBy = [{ name: "asc" }, { id: "asc" }]; break;
      case "name-desc":   orderBy = [{ name: "desc" }, { id: "desc" }]; break;
      case "oldest":      orderBy = [{ createdAt: "asc" }, { id: "asc" }]; break;
      default:            orderBy = [{ createdAt: "desc" }, { id: "desc" }]; break;
    }

    if (cursor) {
      baseWhere.id = { lt: cursor };
      orderBy = orderBy.map(order => ("id" in order ? { id: "desc" } : order));
      if (!orderBy.some(order => "id" in order)) {
        orderBy.push({ id: "desc" });
      }
    }

    // 四個查詢完全平行執行
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

- [ ] **Step 2: 確認 TypeScript 編譯通過**

```bash
pnpm tsc --noEmit
```

Expected: 無新增錯誤

- [ ] **Step 3: Commit**

```bash
git add src/action/product/get-filtered-infinite.ts
git commit -m "perf: flatten Promise.all with shared cached queries in infinite scroll"
```

---

### Task 7: 修改 `src/action/search/get.ts`

**Files:**
- Modify: `src/action/search/get.ts`

> **背景：** `findMany` 和 `count` 目前序列執行（先 findMany，再 count）。改為 `Promise.all` 平行執行。

- [ ] **Step 1: 把 `src/action/search/get.ts` 的序列查詢改為 Promise.all**

把：
```ts
const products = await prisma.product.findMany({
  where: whereConditions,
  include: { category: true },
  orderBy: { [sortBy]: sortOrder },
  skip,
  take: limit,
});

const total = await prisma.product.count({
  where: whereConditions,
});
```

改為：
```ts
const [products, total] = await Promise.all([
  prisma.product.findMany({
    where: whereConditions,
    include: { category: true },
    orderBy: { [sortBy]: sortOrder },
    skip,
    take: limit,
  }),
  prisma.product.count({ where: whereConditions }),
]);
```

- [ ] **Step 2: 確認 TypeScript 編譯通過**

```bash
pnpm tsc --noEmit
```

Expected: 無新增錯誤

- [ ] **Step 3: Commit**

```bash
git add src/action/search/get.ts
git commit -m "perf: parallelize search findMany and count with Promise.all"
```

---

## Chunk 4: 靜態生成 + 圖片快取

### Task 8: 修改 collection 頁面的 `generateStaticParams`

**Files:**
- Modify: `src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx`

> **背景：** 現有 `generateStaticParams` 直接呼叫 `prisma.collection.findMany` + `prisma.category.findMany`，繞過快取層。改用 `getCollections()`（Task 4 已快取），分類改為從各 collection 自己的商品取出（per-collection），不再額外打 DB。

- [ ] **Step 1: 更新 import 和 `generateStaticParams`**

在 `src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx` 中：

1. 移除 `import { prisma } from "@/lib/prisma";`
2. 新增 `import { getCollections } from "@/action/collection";`
3. 把 `generateStaticParams` 改為：

```ts
export async function generateStaticParams() {
  const collections = await getCollections();

  const params: { collectionId: string; categorySlug: string }[] = [];

  for (const c of collections) {
    params.push({ collectionId: c.id, categorySlug: "全部" });

    const collectionCategories = Array.from(
      new Set(
        c.productCollections.map((pc) => pc.product.category.name)
      )
    ).slice(0, 5);

    for (const catName of collectionCategories) {
      params.push({ collectionId: c.id, categorySlug: catName });
    }
  }

  return params;
}
```

- [ ] **Step 2: 確認 TypeScript 編譯通過**

```bash
pnpm tsc --noEmit
```

Expected: 無新增錯誤（`c.productCollections.map(pc => pc.product.category.name)` 的型別需與 `getCollections()` 回傳值相符）

- [ ] **Step 3: Commit**

```bash
git add "src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx"
git commit -m "perf: use cached getCollections() in generateStaticParams"
```

---

### Task 9: 拉長圖片快取 TTL

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: 更新 `minimumCacheTTL`**

把 `next.config.ts` 中的：
```ts
minimumCacheTTL: 60,
```
改為：
```ts
minimumCacheTTL: 3600, // 1 小時（原本 60 秒）
```

- [ ] **Step 2: 確認 TypeScript 編譯通過**

```bash
pnpm tsc --noEmit
```

Expected: 無新增錯誤

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "perf: increase image cache TTL from 60s to 3600s"
```

---

## 最終驗證

- [ ] **全量編譯確認**

```bash
pnpm tsc --noEmit
```

Expected: 0 errors

- [ ] **開發伺服器啟動**

```bash
pnpm dev
```

手動測試以下頁面是否正常：
1. 首頁 `/` — Collections + ProductList 正常顯示
2. Collection 頁面 `/collections/[id]/全部` — 商品列表正常
3. 商品詳情 `/product/[id]` — 商品資料正常
4. 搜尋 `/search?q=...` — 搜尋結果正常
5. 開啟 DevTools Network — 確認 Server Action 回傳正常（非 500）

- [ ] **Final commit（若有未提交的變更）**

```bash
git status
```

---

## 完成後效果

| 改動 | 效果 |
|------|------|
| `unstable_cache` 包所有 read action | DB 查詢從每次都打 → 快取期間 0 次 |
| availableFilters 獨立快取 | 10 分鐘內只查一次（原本每次 filter 都查） |
| flat `Promise.all` (4 成員) | collection info、filters 與主查詢完全平行 |
| search `Promise.all` | findMany + count 平行，省約 50% 等待時間 |
| `generateStaticParams` 用快取 action | ISR 重生成也受益快取 |
| `minimumCacheTTL` 3600 | 圖片 Edge 快取延長到 1 小時 |
