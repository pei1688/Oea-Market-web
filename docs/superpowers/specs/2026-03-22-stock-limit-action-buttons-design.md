# Stock Limit Action Buttons — Design Spec

**Date:** 2026-03-22
**Status:** Draft

---

## Overview

When the cart quantity for a product variant reaches its stock limit, the `ActionButtons` component should be disabled. This spec also covers three related bugs in the existing stock validation logic caused by a stale Zustand subscription pattern.

---

## Bug Root Cause

`useStockValidation` uses `getCartItemByVariantIds` (a stable Zustand function reference) as a `useMemo` dependency. Because the function reference never changes, the memo never re-runs when cart items update — leaving `stockValidation` perpetually stale.

This causes:
- **Bug A**: After cart items are added, "立即購買" incorrectly shows a stock-exceeded toast on the next click
- **Bug B**: After switching variants, the old variant's stock validation state persists momentarily
- **Bug C**: Consecutive "加入購物車" clicks pass validation and exceed stock without any warning

---

## Design

### 1. `cart-store.ts` — Extract `matchCartItem` pure function

Extract the variant-based cart item matching logic into a standalone exported pure function `matchCartItem`. This is used only for the `variantId`/`spec2Id` matching path — it does **not** replace the `selectedVariants` JSON comparison in the `addItem` no-variant fallback branch, which remains unchanged.

```ts
export function matchCartItem(
  item: CartItem,
  productId: string,
  variantId?: string,
  spec2Id?: string,
): boolean {
  if (variantId && spec2Id) {
    return item.productId === productId && item.variantId === variantId && item.spec2Id === spec2Id;
  } else if (variantId) {
    return item.productId === productId && item.variantId === variantId && !item.spec2Id;
  } else {
    // No variantId: match by productId only, no variantId on item
    return item.productId === productId && !item.variantId;
  }
}
```

`getCartItemByVariantIds` is simplified to call `matchCartItem` internally. `addItem` retains its existing no-variant fallback using `selectedVariants` JSON comparison and is NOT refactored to use `matchCartItem`.

`getCartItemByVariantIds` is retained in `CartActions` as it may still be consumed elsewhere. No removal.

---

### 2. `use-stock-validation.ts` — Zustand selector + remove useMemo

Replace the stale `useMemo` + `getCartItemByVariantIds` pattern with a precise Zustand selector using `useCallback`. Dependencies are the primitive values `variantInfo.variantId` and `variantInfo.spec2Id` (not the `variantInfo` object) to avoid spurious re-subscriptions.

```ts
const cartItem = useCartStore(
  useCallback(
    (state) =>
      state.items.find((item) =>
        matchCartItem(item, productId, variantInfo.variantId, variantInfo.spec2Id)
      ),
    [productId, variantInfo.variantId, variantInfo.spec2Id]
  )
);
```

`useMemo` is removed entirely — the selector drives reactivity directly.

**Updated `StockValidation` interface:**

```ts
export interface StockValidation {
  isExceeded: boolean;
  isAtStockLimit: boolean;   // new: cartQuantity >= currentStock && currentStock > 0
  cartQuantity: number;
  availableQuantity: number;
  currentStock: number;
  // totalQuantity removed: no consumers outside this hook; covered by cartQuantity + quantity
}
```

`totalQuantity` is removed from the interface. It was only computed internally and never read externally. If this turns out to be wrong, a TypeScript error will surface at compile time.

**`isAtStockLimit` definition:**

```ts
const isAtStockLimit = currentStock > 0 && cartQuantity >= currentStock;
```

Explicitly `false` when `currentStock === 0` to avoid conflating "out of stock" with "cart is full". The out-of-stock case is already handled by `variantInfo.stock === 0` in `isDisabled`.

---

### 3. `product-detail.tsx` — isDisabled + unified toast

**Update `isDisabled`:**

```ts
const isDisabled =
  variantInfo.stock === 0 ||
  (Object.keys(groupedVariants).length > 0 && !isAllVariantsSelected) ||
  stockValidation.isAtStockLimit;
```

**Conditional toast message** (replaces both existing toast branches — intentional UX decision):

When `stockValidation.isExceeded` is true, display one of two messages depending on whether the cart already has items:

- `cartQuantity > 0` → `購物車裡目前已有 ${cartQuantity} 件該商品，已達庫存上限，請至購物車頁面查看。`
- `cartQuantity === 0` → `所選數量超過庫存上限（庫存：${currentStock} 件），請調整數量。`

The `cartQuantity === 0` case occurs when the cart is empty but the user selects a quantity larger than the available stock. Showing "已有 0 件" in that scenario is grammatically incoherent, so a separate message is used.

**Pass `isAtStockLimit` to `ActionButtons`:**

```tsx
<ActionButtons
  isDisabled={isDisabled}
  isAtStockLimit={stockValidation.isAtStockLimit}
  ...
/>
```

---

### 4. `action-buttons.tsx` — New prop + button label priority

Add `isAtStockLimit` prop. Remove the unused `quantity` prop.

```ts
interface ActionButtonsProps {
  isDisabled: boolean;
  isAtStockLimit: boolean;  // new
  onAddToCart: () => void;
  onBuyNow: () => void;
  isAdded: boolean;
  // quantity removed: not used in render
}
```

**Button label priority for "加入購物車":**

1. `isAtStockLimit` → "庫存已達上限"
2. `isAdded` → checkmark + "已加入"
3. default → "加入購物車"

Both buttons are disabled via `isDisabled` (which already includes `isAtStockLimit`). The label change provides additional visual feedback for the stock-limit state.

---

## Edge Cases

- **No variants**: `variantInfo.variantId` is `undefined`. `matchCartItem` falls into the `!item.variantId` branch, matching products with no variant correctly.
- **Out of stock (`stock === 0`)**: `isAtStockLimit` is explicitly `false` (guarded by `currentStock > 0`). `isDisabled` is already `true` via `variantInfo.stock === 0`. Button label shows default "加入購物車" (disabled state only).
- **Variant not fully selected**: `variantInfo.stock === 0` and `variantInfo.variantId` is `undefined`. `isAtStockLimit` is `false`. `isDisabled` is `true`.
- **spec2 combinations**: `matchCartItem` handles `variantId + spec2Id` pair correctly, matching the same logic as `getCartItemByVariantIds`.

---

## Files Changed

| File | Change |
|------|--------|
| `src/store/cart-store.ts` | Export `matchCartItem` pure function; simplify `getCartItemByVariantIds` to use it |
| `src/hooks/product/use-stock-validation.ts` | Replace `useMemo` + function dep with Zustand selector + `useCallback`; add `isAtStockLimit`; remove `totalQuantity` |
| `src/modules/product/components/product-detail/product-detail.tsx` | Add `isAtStockLimit` to `isDisabled`; unify toast message; pass `isAtStockLimit` to `ActionButtons` |
| `src/modules/product/components/product-detail/action-buttons.tsx` | Add `isAtStockLimit` prop; remove `quantity` prop; update button label priority |

---

## Out of Scope

- Cart page stock validation (separate concern)
- Server-side stock checks
- Optimistic UI rollback on stock conflicts
