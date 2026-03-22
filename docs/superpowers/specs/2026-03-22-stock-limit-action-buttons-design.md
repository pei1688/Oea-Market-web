# Stock Limit Action Buttons — Design Spec

**Date:** 2026-03-22
**Status:** Approved

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

Extract the cart item matching logic into a standalone exported pure function `matchCartItem`. This eliminates duplicated logic across `addItem`, `getCartItemByVariantIds`, and the new Zustand selector in `useStockValidation`.

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
    return item.productId === productId && !item.variantId;
  }
}
```

`addItem` and `getCartItemByVariantIds` are simplified to call `matchCartItem` internally.

---

### 2. `use-stock-validation.ts` — Zustand selector + remove useMemo

Replace the stale `useMemo` + `getCartItemByVariantIds` pattern with a precise Zustand selector using `useCallback` so that the component re-renders only when the specific cart item changes.

```ts
const cartItem = useCartStore(
  useCallback(
    (state) =>
      state.items.find((item) =>
        matchCartItem(item, productId, variantInfo.variantId, variantInfo.spec2Id)
      ),
    [productId, variantInfo]
  )
);
```

Add `isAtStockLimit` to the `StockValidation` interface:

```ts
export interface StockValidation {
  isExceeded: boolean;
  isAtStockLimit: boolean;   // cartQuantity >= currentStock
  cartQuantity: number;
  availableQuantity: number;
  currentStock: number;
}
```

`useMemo` is removed entirely — the selector drives reactivity directly.

---

### 3. `product-detail.tsx` — isDisabled + unified toast

**Update `isDisabled`:**

```ts
const isDisabled =
  variantInfo.stock === 0 ||
  (Object.keys(groupedVariants).length > 0 && !isAllVariantsSelected) ||
  stockValidation.isAtStockLimit;
```

**Unify toast message** (replace the two existing toast branches):

```
購物車裡目前已有 ${stockValidation.cartQuantity} 件該商品，已達庫存上限，請至購物車頁面查看。
```

Triggered whenever `stockValidation.isExceeded` is true (covers both partial-exceeded and fully-at-limit cases).

**Pass `isAtStockLimit` to `ActionButtons`:**

```tsx
<ActionButtons
  isDisabled={isDisabled}
  isAtStockLimit={stockValidation.isAtStockLimit}
  ...
/>
```

---

### 4. `action-buttons.tsx` — New prop + button text

Add `isAtStockLimit` prop. When true, replace the "加入購物車" button label with "庫存已達上限". Both buttons remain disabled via `isDisabled`.

```ts
interface ActionButtonsProps {
  isDisabled: boolean;
  isAtStockLimit: boolean;  // new
  onAddToCart: () => void;
  onBuyNow: () => void;
  isAdded: boolean;
  quantity: number;
}
```

Button label logic:
- `isAtStockLimit` → show "庫存已達上限"
- `isAdded` → show "已加入" with checkmark
- default → show "加入購物車"

---

## Files Changed

| File | Change |
|------|--------|
| `src/store/cart-store.ts` | Export `matchCartItem` pure function; simplify `addItem` and `getCartItemByVariantIds` |
| `src/hooks/product/use-stock-validation.ts` | Replace `useMemo` + function dep with Zustand selector + `useCallback`; add `isAtStockLimit` to return type |
| `src/modules/product/components/product-detail/product-detail.tsx` | Add `isAtStockLimit` to `isDisabled`; unify toast message; pass `isAtStockLimit` to `ActionButtons` |
| `src/modules/product/components/product-detail/action-buttons.tsx` | Add `isAtStockLimit` prop; update button label logic |

---

## Out of Scope

- Cart page stock validation (separate concern)
- Server-side stock checks
- Optimistic UI rollback on stock conflicts
