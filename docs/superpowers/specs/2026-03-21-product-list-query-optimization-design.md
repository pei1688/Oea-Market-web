# Product List Query Optimization

**Date:** 2026-03-21
**Status:** Approved

## Problem

過濾商品時 skeleton 等待時間過長。根本原因：`productInclude` 在 list 查詢中 JOIN 了 `variants → spec2Combinations` 與 `productCollections`，但 `ProductItem` 根本不使用這些欄位。

## Solution

建立 `productListSelect`，只 select list view 實際需要的欄位，並在 filtered 查詢中改用它。

## Changes

### 1. `src/lib/prisma-includes.ts`

新增 `productListSelect`：

```ts
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
} satisfies Prisma.ProductSelect;
```

保留原本 `productInclude`（供 product detail 頁使用）。

### 2. `src/action/product/get-filtered-infinite.ts`

`_getInfiniteFirstPage` 與 cursor 頁的 `findMany` 改用 `select: productListSelect`。

### 3. `src/action/product/get-filtered.ts`

同上，保持一致。

### 4. `src/action/product/get.ts` — `getRelatedProducts`

相關商品也渲染進 `ProductItem`，同樣改用 `select: productListSelect`。

## Call Site Change Pattern

每個 `findMany` 的改法：

```ts
// 改前
include: productInclude,

// 改後
select: productListSelect,
```

Prisma 不允許 `include` 與 `select` 並存，TypeScript 會在編譯期檢查。

## Out of Scope

- `getProduct` — 單一商品詳情，需要完整 variants 資料，保留 `productInclude`
- `getProductsByCollectionId` — 結構複雜（nested in collection），有 5 分鐘 cache，暫不處理
- `getProducts` — 確認為死碼，不處理

## Expected Outcome

DB 查詢不再 JOIN `variants`、`spec2Combinations`、`productCollections`，查詢時間大幅下降。
