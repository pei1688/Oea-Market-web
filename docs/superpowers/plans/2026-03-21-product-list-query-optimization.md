# Product List Query Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除 product list 查詢中不必要的 `variants → spec2Combinations` 及 `productCollections` JOIN，大幅降低 DB 查詢時間。

**Architecture:** 新增 `productListSelect`（Prisma select）只取 `ProductItem` 實際需要的欄位，取代 `productInclude`（Prisma include）用於所有 list 查詢。`productInclude` 保留供 product detail 頁使用。

**Tech Stack:** Next.js 14 App Router, Prisma ORM, TypeScript, pnpm

---

## Files Modified

| File | 變更 |
|------|------|
| `src/lib/prisma-includes.ts` | 新增 `productListSelect` |
| `src/action/product/get-filtered-infinite.ts` | 改用 `select: productListSelect`（2 處）|
| `src/action/product/get-filtered.ts` | 改用 `select: productListSelect`（1 處）|
| `src/action/product/get.ts` | `getRelatedProducts` 改用 `select: productListSelect`（1 處）|

---

## Task 1: 新增 `productListSelect`

**Files:**
- Modify: `src/lib/prisma-includes.ts`

- [ ] **Step 1: 開啟 `src/lib/prisma-includes.ts`，在現有 `productInclude` 下方加入 `productListSelect`**

```ts
import { Prisma } from "@prisma/client";

export const productInclude = {
  category: true,
  variants: {
    include: {
      spec2Combinations: true,
    },
  },
  productCollections: {
    take: 1,
    include: {
      collection: {
        select: { id: true, name: true },
      },
    },
  },
} as const satisfies Prisma.ProductInclude;

// List view 專用：只 select ProductItem 實際需要的欄位
export const productListSelect = {
  id: true,
  name: true,
  price: true,
  imgUrl: true,
  isOnSale: true,
  discountPercentage: true,
  category: {
    select: { id: true, name: true },
  },
} as const satisfies Prisma.ProductSelect;
```

- [ ] **Step 2: 確認 TypeScript 不報錯**

```bash
pnpm tsc --noEmit
```

Expected: 無錯誤（或僅有與此次改動無關的既有錯誤）

---

## Task 2: 更新 `get-filtered-infinite.ts`

**Files:**
- Modify: `src/action/product/get-filtered-infinite.ts`

這個檔案有兩個 `findMany` 使用 `productInclude`：第一頁（`_getInfiniteFirstPage`，約 line 94）和 cursor 分頁（約 line 211）。

- [ ] **Step 1: 更新 import**

在檔案頂部，找到：
```ts
import { productInclude } from "@/lib/prisma-includes";
```

改為：
```ts
import { productListSelect } from "@/lib/prisma-includes";
```

- [ ] **Step 2: 更新 `_getInfiniteFirstPage` 的 `findMany`**

找到（約 line 94）：
```ts
prisma.product.findMany({
  where: baseWhere,
  include: productInclude,
  orderBy,
  take: limit + 1,
}),
```

改為：
```ts
prisma.product.findMany({
  where: baseWhere,
  select: productListSelect,
  orderBy,
  take: limit + 1,
}),
```

- [ ] **Step 3: 更新 cursor 分頁的 `findMany`**

找到第二個（約 line 211）：
```ts
prisma.product.findMany({
  where: baseWhere,
  include: productInclude,
  orderBy,
  take: limit + 1,
}),
```

改為：
```ts
prisma.product.findMany({
  where: baseWhere,
  select: productListSelect,
  orderBy,
  take: limit + 1,
}),
```

- [ ] **Step 4: 確認 TypeScript 不報錯**

```bash
pnpm tsc --noEmit
```

Expected: 無錯誤

---

## Task 3: 更新 `get-filtered.ts`

**Files:**
- Modify: `src/action/product/get-filtered.ts`

- [ ] **Step 1: 更新 import**

找到：
```ts
import { productInclude } from "@/lib/prisma-includes";
```

改為：
```ts
import { productListSelect } from "@/lib/prisma-includes";
```

- [ ] **Step 2: 更新 `findMany`（約 line 88）**

找到：
```ts
prisma.product.findMany({
  where: baseWhere,
  include: productInclude,
  orderBy,
  skip,
  take: limit,
}),
```

改為：
```ts
prisma.product.findMany({
  where: baseWhere,
  select: productListSelect,
  orderBy,
  skip,
  take: limit,
}),
```

- [ ] **Step 3: 確認 TypeScript 不報錯**

```bash
pnpm tsc --noEmit
```

---

## Task 4: 更新 `getRelatedProducts` in `get.ts`

**Files:**
- Modify: `src/action/product/get.ts`

注意：`get.ts` 同時有 `getProduct`（單一商品詳情）仍需完整 `productInclude`。只改 `getRelatedProducts`。

- [ ] **Step 1: 在現有 import 行新增 `productListSelect`**

找到：
```ts
import { productInclude } from "@/lib/prisma-includes";
```

改為：
```ts
import { productInclude, productListSelect } from "@/lib/prisma-includes";
```

- [ ] **Step 2: 更新 `getRelatedProducts` 的 `findMany`（約 line 43）**

找到：
```ts
const related = await prisma.product.findMany({
  where: {
    categoryId,
    NOT: { id: excludeProductId },
  },
  skip,
  take: limit,
  include: productInclude,
});
```

改為：
```ts
const related = await prisma.product.findMany({
  where: {
    categoryId,
    NOT: { id: excludeProductId },
  },
  skip,
  take: limit,
  select: productListSelect,
});
```

- [ ] **Step 3: 確認 TypeScript 不報錯**

```bash
pnpm tsc --noEmit
```

> **Note:** `getRelatedProducts` 的回傳型別在這次改動後會從完整 include 形狀縮窄為 `productListSelect` 形狀。`prodcut-alsolike.tsx` 接收 `product={pd}` 傳入 `ProductItem`（期望 `ProductListItem`），由於縮窄後的型別仍結構性符合 `ProductListItem`，TypeScript 不需額外 cast，但 code review 時可留意此型別變化。

---

## Task 5: 整合驗證與 commit

- [ ] **Step 0: 確認 `getProducts` 無實際呼叫者（dead code 驗證）**

```bash
grep -r "getProducts" src/ --include="*.ts" --include="*.tsx" -l
```

Expected: 只出現 `src/action/product/get.ts` 本身（export 定義處）。若有其他檔案出現，需確認該呼叫是否渲染進 `ProductItem`，若是則也需更新。

- [ ] **Step 1: 最終編譯確認**

```bash
pnpm tsc --noEmit
```

Expected: 無新增錯誤

- [ ] **Step 2: 啟動 dev server**

```bash
pnpm dev
```

- [ ] **Step 3: 手動驗證 category 頁**

1. 開啟任意商品分類頁（`/collections/...`）
2. 點擊左側 category 或 brand checkbox
3. 確認商品列表正確顯示過濾結果
4. 確認商品卡片（圖片、名稱、價格、折扣）顯示正常
5. 確認 skeleton 等待時間明顯縮短

- [ ] **Step 4: 手動驗證相關商品**

開啟任意商品詳情頁，確認下方相關商品卡片正常顯示。

- [ ] **Step 5: Commit**

```bash
git add src/lib/prisma-includes.ts \
        src/action/product/get-filtered-infinite.ts \
        src/action/product/get-filtered.ts \
        src/action/product/get.ts
git commit -m "perf: use productListSelect in list queries to remove unnecessary variant joins"
```
