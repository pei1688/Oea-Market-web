# 電商網站效能優化設計文件

**日期：** 2026-03-16
**範圍：** 載入速度優化 + Server Action DB 查詢優化
**部署環境：** Vercel
**資料更新頻率：** 低（每天/每週更新幾次）

---

## 背景與問題

目前網站存在以下效能問題：

1. **所有 Server Action 每次都直接打 DB** — 沒有任何快取層
2. **`getFilteredProductsByCollection` 每次有額外多餘查詢** — `availableFilters`（分類+品牌清單）每次都重新撈，但這個資料幾乎不變
3. **`productInclude` 在 3 個檔案重複定義** — `get.ts`、`get-filtered.ts`、`get-filtered-infinite.ts`
4. **Collection 頁面的 `generateStaticParams` 直接呼叫 `prisma`** — 應改用快取過的 action，讓 ISR 也受益
5. **Search 的 `findMany` 和 `count` 是序列執行** — 可改為 `Promise.all` 平行執行
6. **`minimumCacheTTL` 過短** — 目前圖片快取只有 60 秒，靜態圖片資源應快取更久

---

## 方案選擇

選擇**方案 C（全面優化）**，結合快取架構 + DB query 修正 + 靜態生成改善。

---

## Section 1：快取架構（`unstable_cache` + tag）

### 目標
所有 read action 加上 Next.js `unstable_cache`，設定 time-based revalidate 與 cache tag。

### 關鍵模式：`"use server"` + `unstable_cache` 正確寫法

`"use server"` 標記的函式是 Server Action（可從 Client Component 呼叫的 RPC）。
**不能**直接把 exported server action 包進 `unstable_cache`，否則會破壞 RPC 邊界。

正確模式：**把 DB 查詢邏輯抽成私有函式，私有函式套 `unstable_cache`，exported server action 呼叫快取後的私有函式。**

```ts
"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-keys";

// 私有：被快取的實際查詢
const _getProduct = unstable_cache(
  async (productId: string) => {
    return prisma.product.findUnique({
      where: { id: productId },
      include: productInclude,
    });
  },
  ["product"],           // keyParts 前綴（不含動態 id）
  {
    tags: [CACHE_TAGS.products],   // 用來 revalidateTag 清除
    revalidate: 300,
  }
);

// Public exported server action — 仍是 server action，只是委派給快取版
export async function getProduct(productId: string) {
  return _getProduct(productId);
}
```

> **注意：** `unstable_cache` 會把傳入的參數（如 `productId`）自動納入快取 key，因此 keyParts 只需提供固定前綴，不需手動拼接 id。

### 新增檔案
- `src/lib/cache-keys.ts` — 統一管理所有 cache tag 常數

```ts
// src/lib/cache-keys.ts
export const CACHE_TAGS = {
  products: "products",
  collections: "collections",
} as const;
```

### 快取策略

| 資料 | revalidate | tag |
|------|-----------|-----|
| 商品列表 | 300 秒 (5 分鐘) | `products` |
| 單一商品 | 300 秒 | `products` |
| Collection 清單 | 600 秒 (10 分鐘) | `collections` |
| availableFilters | 600 秒 | `collections` |

### 關於 `getRelatedProducts` 的特殊處理

`getRelatedProducts` 內部使用 `Math.random()` 做隨機偏移，**不能快取**（快取會凍結隨機結果）。

處理方式：從 DB 撈出候選商品後，**不快取整個函式**，或改成把隨機邏輯移到 component 端：先 `getRelatedProducts` 撈固定候選集（可快取），再在 component 中用 `Math.random()` 選取。本次優化中排除此函式的快取，維持現狀。

### 快取失效策略

本次採用 **time-based revalidation**（商品 5 分鐘、Collections 10 分鐘），適合低頻更新的電商。

若未來需要更即時的更新，可在 mutation action（新增/修改商品）中加入：
```ts
import { revalidateTag } from "next/cache";
revalidateTag(CACHE_TAGS.products);
```
本次不實作 mutation 的 tag 清除，留作後續擴充。

### 修改的 Action 檔案

**`src/action/product/get.ts`** — `getProducts`、`getProduct`、`getProductsByCollectionId`、`getProductIds` 套快取（`getRelatedProducts` 排除）

| 函式 | keyParts | tag | revalidate |
|------|---------|-----|-----------|
| `getProducts` | `["products"]` | `products` | 300 |
| `getProduct` | `["product"]` | `products` | 300 |
| `getProductsByCollectionId` | `["products-by-collection"]` | `products` | 300 |
| `getProductIds` | `["product-ids"]` | `products` | 300 |

**`src/action/collection/get.ts`** — `getCollections`、`getCollectionById`、`getCollectionsWithCategory` 套快取

| 函式 | keyParts | tag | revalidate |
|------|---------|-----|-----------|
| `getCollections` | `["collections"]` | `collections` | 600 |
| `getCollectionById` | `["collection-by-id"]` | `collections` | 600 |
| `getCollectionsWithCategory` | `["collections-with-category"]` | `collections` | 600 |

---

## Section 2：DB Query 修正

### 2a. 拆出 `availableFilters` 獨立快取

**問題：** `getFilteredProductsByCollection` 和 `getInfiniteFilteredProductsByCollection` 每次執行 3 個查詢，其中 `availableFilters` 查詢資料幾乎不變但每次都重跑。

**修改：** 新增兩個私有快取函式：

1. `_getCollectionInfo(collectionId)` — 用 `unstable_cache` 包起來，keyParts: `["collection-info"]`，tag: `collections`，revalidate: 600 秒。取代目前 `prisma.collection.findUnique` 的 inline 呼叫。

2. `_getAvailableFilters(collectionId)` — 用 `unstable_cache` 包起來，keyParts: `["available-filters"]`，tag: `collections`，revalidate: 600 秒。從 collection 撈 `category.name` 和 `brand`。

主查詢改成 flat `Promise.all`（4 個成員，完全平行）：

```ts
const [collection, products, totalCount, filters] = await Promise.all([
  _getCollectionInfo(collectionId),    // 私有快取函式
  prisma.product.findMany({ where: baseWhere, include: productInclude, orderBy, skip, take: limit }),
  prisma.product.count({ where: baseWhere }),
  _getAvailableFilters(collectionId),  // 私有快取函式
]);
```

> **注意：** `products` 和 `totalCount` 查詢仍直接打 DB（因為帶有 filter/sort/pagination 參數，快取命中率低），但 `collection` 和 `filters` 這兩個幾乎不變的資料改為快取。

**影響檔案：**
- `src/action/product/get-filtered.ts`
- `src/action/product/get-filtered-infinite.ts`

### 2b. 統一 `productInclude`

**問題：** `productInclude` 常數在 3 個檔案各定義一次。

**修改：** 新增 `src/lib/prisma-includes.ts`，從此統一 import。

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

**影響檔案：**
- `src/action/product/get.ts`
- `src/action/product/get-filtered.ts`
- `src/action/product/get-filtered-infinite.ts`

### 2c. Search 改 `Promise.all`

**問題：** `getProductFormSearch` 的 `findMany` 和 `count` 是序列執行。

**修改：**

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

**影響檔案：**
- `src/action/search/get.ts`

---

## Section 3：靜態生成改善 + 圖片快取

### 3a. Collection 頁面 `generateStaticParams` 改用快取 action

**現狀：** `generateStaticParams` 已存在（`revalidate = 300` 也已設定），但內部直接呼叫 `prisma.collection.findMany` 和 `prisma.category.findMany`，繞過快取層。

**修改：** 改用快取過的 `getCollections()`，讓 ISR 重新生成時也能受益於快取。同時把分類改為從各 collection 自己的商品中取出（per-collection），比原本的全局 top-5 分類更精準。

```ts
// src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx
import { getCollections } from "@/action/collection";

export const revalidate = 300; // 不變

export async function generateStaticParams() {
  const collections = await getCollections(); // 改用快取 action，不再直接打 DB

  const params = [];
  for (const c of collections) {
    params.push({ collectionId: c.id, categorySlug: "全部" });
    // 從各 collection 自己的商品取出分類（per-collection），取前 5 個
    const collectionCategories = Array.from(
      new Set(
        c.productCollections.map(pc => pc.product.category.name)
      )
    ).slice(0, 5);
    for (const catName of collectionCategories) {
      params.push({ collectionId: c.id, categorySlug: catName });
    }
  }
  return params;
}
```

### 3b. 圖片快取 TTL 拉長

**問題：** `next.config.ts` 的 `minimumCacheTTL` 只有 60 秒，但圖片來源（UploadThing、Cloudinary）是靜態資源。

**修改：**

```ts
// next.config.ts
minimumCacheTTL: 3600, // 1 小時（原本 60 秒）
```

---

## 變更摘要

| 檔案 | 類型 | 改動內容 |
|------|------|---------|
| `src/lib/cache-keys.ts` | 新增 | Cache tag 常數 |
| `src/lib/prisma-includes.ts` | 新增 | 統一 productInclude（含 Prisma type 約束） |
| `src/action/product/get.ts` | 修改 | 加 unstable_cache（排除 getRelatedProducts） |
| `src/action/product/get-filtered.ts` | 修改 | 拆 availableFilters、flat Promise.all |
| `src/action/product/get-filtered-infinite.ts` | 修改 | 拆 availableFilters、flat Promise.all |
| `src/action/collection/get.ts` | 修改 | 加 unstable_cache |
| `src/action/search/get.ts` | 修改 | 改 Promise.all |
| `src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx` | 修改 | generateStaticParams 改用快取 action |
| `next.config.ts` | 修改 | minimumCacheTTL 3600 |

---

## 預期效果

- **首次載入**：大幅減少（Collection/Product 頁面直接 serve 靜態頁或快取）
- **DB 查詢次數**：每個頁面從每次都打 DB → 快取期間 0 次 DB 查詢
- **`availableFilters`**：從每次 filter 操作都打 DB → 獨立快取，10 分鐘內只打一次
- **Search 回應時間**：count 和 findMany 平行執行，省約 50% 查詢等待時間
- **圖片載入**：Edge 快取從 60 秒延長到 1 小時，減少 origin 請求
