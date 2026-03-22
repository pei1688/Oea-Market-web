# Stock Limit Action Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix stale Zustand subscription bugs in stock validation and disable ActionButtons when cart quantity reaches the stock limit.

**Architecture:** Extract a `matchCartItem` pure function from `cart-store.ts`, then rewrite `useStockValidation` to use a precise Zustand selector instead of a stale `useMemo`. Wire `isAtStockLimit` through `ProductDetail` into `ActionButtons` for visual feedback.

**Tech Stack:** Next.js 14, TypeScript, Zustand, React hooks

**Spec:** `docs/superpowers/specs/2026-03-22-stock-limit-action-buttons-design.md`

**Verification command (no test framework — use TypeScript):**
```bash
npx tsc --noEmit
```

---

### Task 1: Extract `matchCartItem` pure function from `cart-store.ts`

**Files:**
- Modify: `src/store/cart-store.ts`

**Context:** `getCartItemByVariantIds` and the upcoming `useStockValidation` selector both need the same variant-matching logic. Extract it into an exported pure function. `addItem`'s no-variant fallback (`selectedVariants` JSON comparison) is intentionally NOT refactored — only the `variantId`/`spec2Id` path is extracted.

- [ ] **Step 1: Add `matchCartItem` after the `CartActions` interface, before `calculateTotals`**

In `src/store/cart-store.ts`, locate the `calculateTotals` helper function (around line 57). Insert the following pure function directly above it:

```ts
export function matchCartItem(
  item: CartItem,
  productId: string,
  variantId?: string,
  spec2Id?: string,
): boolean {
  if (variantId && spec2Id) {
    return (
      item.productId === productId &&
      item.variantId === variantId &&
      item.spec2Id === spec2Id
    );
  } else if (variantId) {
    return (
      item.productId === productId &&
      item.variantId === variantId &&
      !item.spec2Id
    );
  } else {
    return item.productId === productId && !item.variantId;
  }
}
```

- [ ] **Step 2: Simplify `getCartItemByVariantIds` to use `matchCartItem`**

Replace the body of `getCartItemByVariantIds` inside the store:

```ts
getCartItemByVariantIds: (productId, variantId, spec2Id) => {
  return get().items.find((item) =>
    matchCartItem(item, productId, variantId, spec2Id)
  );
},
```

The `addItem` function is left unchanged.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/store/cart-store.ts
git commit -m "refactor: extract matchCartItem pure function from cart-store"
```

---

### Task 2: Rewrite `useStockValidation` with Zustand selector

**Files:**
- Modify: `src/hooks/product/use-stock-validation.ts`

**Context:** The current hook uses `useMemo` with `getCartItemByVariantIds` as a dependency. Because Zustand returns a stable function reference, the memo never re-runs when cart items change — causing stale validation state (Bugs A, B, C). Replace with a precise selector using `useCallback` and remove `useMemo` entirely.

The `StockValidation` interface gains `isAtStockLimit` and loses `totalQuantity` (unused externally — TypeScript will surface any hidden consumers as compile errors).

- [ ] **Step 1: Rewrite `use-stock-validation.ts`**

Replace the entire file content:

```ts
import { useCallback } from "react";
import { useCartStore, matchCartItem } from "@/store/cart-store";
import { useProductDetailStore } from "@/store/product-detail-store";
import { VariantInfo } from "./use-variant-stock";

export interface StockValidation {
  isExceeded: boolean;
  isAtStockLimit: boolean;
  cartQuantity: number;
  availableQuantity: number;
  currentStock: number;
}

interface StockValidationOverrides {
  quantity?: number;
}

export const useStockValidation = (
  productId: string,
  variantInfo: VariantInfo,
  overrides?: StockValidationOverrides,
): StockValidation => {
  const { quantity: storeQuantity } = useProductDetailStore();
  const quantity = overrides?.quantity ?? storeQuantity;

  const cartItem = useCartStore(
    useCallback(
      (state) =>
        state.items.find((item) =>
          matchCartItem(item, productId, variantInfo.variantId, variantInfo.spec2Id)
        ),
      [productId, variantInfo.variantId, variantInfo.spec2Id]
    )
  );

  const cartQuantity = cartItem ? cartItem.quantity : 0;
  const currentStock = variantInfo.stock;
  const totalQuantity = cartQuantity + quantity;
  const isExceeded = totalQuantity > currentStock;
  const isAtStockLimit = currentStock > 0 && cartQuantity >= currentStock;

  return {
    isExceeded,
    isAtStockLimit,
    cartQuantity,
    availableQuantity: currentStock - cartQuantity,
    currentStock,
  };
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If `totalQuantity` was referenced externally somewhere, TypeScript will surface it here — fix those callsites if any appear.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/product/use-stock-validation.ts
git commit -m "fix: replace stale useMemo with Zustand selector in useStockValidation"
```

---

### Task 3: Update `ActionButtons` — new prop, remove `quantity`, button label

**Files:**
- Modify: `src/modules/product/components/product-detail/action-buttons.tsx`

**Note:** This task is done before Task 4 so TypeScript compilation remains clean when `product-detail.tsx` is updated.

**Context:** Add `isAtStockLimit` prop for the "庫存已達上限" label. Remove the unused `quantity` prop. Button label priority: `isAtStockLimit` > `isAdded` > default.

- [ ] **Step 1: Update `ActionButtonsProps` interface and destructuring**

Replace the interface and component signature:

```ts
interface ActionButtonsProps {
  isDisabled: boolean;
  isAtStockLimit: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  isAdded: boolean;
}

export const ActionButtons = ({
  isDisabled,
  isAtStockLimit,
  onAddToCart,
  onBuyNow,
  isAdded,
}: ActionButtonsProps) => {
```

- [ ] **Step 2: Update "加入購物車" button label logic**

Replace the second `<Button>` element with:

```tsx
<Button
  onClick={onAddToCart}
  disabled={isDisabled || isAdded}
  variant={"default2"}
  className="flex-1 text-fuchsia-800 transition-all duration-300 disabled:opacity-90"
>
  {isAtStockLimit ? (
    <>庫存已達上限</>
  ) : isAdded ? (
    <>
      <svg
        width="24px"
        height="24px"
        strokeWidth="1"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        color="currentColor"
        className="text-green-700"
      >
        <path
          d="M5 13L9 17L19 7"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isAdded ? "check-path" : ""}
        ></path>
      </svg>
      已加入
    </>
  ) : (
    <>加入購物車</>
  )}
</Button>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: TypeScript will report that `product-detail.tsx` is still passing the old `quantity` prop and missing `isAtStockLimit` — that is expected and will be fixed in Task 4. The `action-buttons.tsx` file itself should have no errors.

- [ ] **Step 4: Commit**

```bash
git add src/modules/product/components/product-detail/action-buttons.tsx
git commit -m "feat: add isAtStockLimit prop to ActionButtons, show stock limit label"
```

---

### Task 4: Update `ProductDetail` — `isDisabled`, conditional toast, and prop wiring

**Files:**
- Modify: `src/modules/product/components/product-detail/product-detail.tsx`

**Context:** Add `isAtStockLimit` to the `isDisabled` expression. Replace the two-branch toast logic with a conditional message that is grammatically correct for both the "cart has items" and "cart is empty but quantity exceeds stock" cases. Pass `isAtStockLimit` to `ActionButtons` and remove the `quantity` prop.

- [ ] **Step 1: Update `isDisabled`**

Find the `isDisabled` constant (around line 215) and replace it:

```ts
const isDisabled =
  variantInfo.stock === 0 ||
  (Object.keys(groupedVariants).length > 0 && !isAllVariantsSelected) ||
  stockValidation.isAtStockLimit;
```

- [ ] **Step 2: Replace the toast in `validateSelection` with a conditional message**

Find `validateSelection` (around line 161) and replace the entire `if (stockValidation.isExceeded)` block:

```ts
if (stockValidation.isExceeded) {
  if (stockValidation.cartQuantity > 0) {
    toast.error(
      `購物車裡目前已有 ${stockValidation.cartQuantity} 件該商品，已達庫存上限，請至購物車頁面查看。`
    );
  } else {
    toast.error(
      `所選數量超過庫存上限（庫存：${stockValidation.currentStock} 件），請調整數量。`
    );
  }
  return false;
}
```

- [ ] **Step 3: Update `ActionButtons` JSX — add `isAtStockLimit`, remove `quantity`**

Find the `<ActionButtons ... />` JSX (around line 245) and replace it:

```tsx
<ActionButtons
  isDisabled={isDisabled}
  isAtStockLimit={stockValidation.isAtStockLimit}
  onAddToCart={handleAddToCart}
  onBuyNow={handleBuyNow}
  isAdded={isAdded}
/>
```

- [ ] **Step 4: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors across all changed files.

- [ ] **Step 5: Commit**

```bash
git add src/modules/product/components/product-detail/product-detail.tsx
git commit -m "feat: disable action buttons at stock limit, conditional stock toast"
```

---

### Task 5: Final verification

- [ ] **Step 1: Run lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 2: Manual smoke test — Bug C (reactive disable after consecutive adds)**

1. Open a product page with stock = 2
2. Select quantity = 1, click "加入購物車"
3. Wait for "已加入" animation to reset (~1s)
4. Click "加入購物車" a second time (this add succeeds — cart now has 2 units)
5. Expected: button **immediately** disables and label changes to "庫存已達上限" without a page refresh (reactive Zustand selector triggers the re-render)

- [ ] **Step 3: Manual smoke test — Bug A (buy now stale state on back navigation)**

1. Open a product page with stock = 1
2. Click "立即購買" — adds to cart and navigates to cart
3. Navigate back to the same product page
4. Expected: both buttons are disabled, "加入購物車" shows "庫存已達上限"

- [ ] **Step 4: Manual smoke test — out-of-stock product**

1. Open a product with stock = 0
2. Expected: both buttons disabled, "加入購物車" shows "加入購物車" (NOT "庫存已達上限" — out-of-stock is a different state)

- [ ] **Step 5: Manual smoke test — empty cart, quantity exceeds stock**

1. Open a product with stock = 3, cart is empty
2. Select quantity = 4, click "加入購物車"
3. Expected toast: `所選數量超過庫存上限（庫存：3 件），請調整數量。`

- [ ] **Step 6: Manual smoke test — cart has items, adding would exceed stock**

1. Open a product with stock = 3, add 2 to cart first
2. Navigate back to the product page, select quantity = 2, click "加入購物車"
3. Expected toast: `購物車裡目前已有 2 件該商品，已達庫存上限，請至購物車頁面查看。`
