# Product Dialog Local State Fix

Date: 2026-03-20

## Bug

`ProductDialogDetail` (the quick-add cart dialog in `product-dialog-item.tsx`) and `ProductDetail` (the main product page in `product-detail.tsx`) both consume the same global `useProductDetailStore`. This causes an infinite update loop:

1. User opens the alsolike cart dialog for product B while the main page shows product A.
2. `ProductDialogDetail` effect fires: `currentProductId (A) ≠ B` → calls `initializeWithDefaults(B defaults)` then `setCurrentProductId(B)` as two separate Zustand `set()` calls.
3. The first call changes `currentImage`, which triggers a re-render. At this point `currentProductId` is still A.
4. `ProductDetail` (product A) sees the store changed. It reads `currentProductId = A` (still old value mid-flight) and `product.id = A` — but in the next microtask `currentProductId = B`, so its condition `currentProductId !== product.id` becomes `B !== A` = true.
5. `ProductDetail` re-initializes back to A values, setting `currentProductId = A`.
6. `ProductDialogDetail` sees A again, re-initializes to B → infinite loop.

React reports "Maximum update depth exceeded" inside `ProductDetail.useEffect`.

## Fix

`ProductDialogDetail` should use **local `useState`** instead of the global store. The dialog is an ephemeral quick-add UI: its selection state exists only while the dialog is open and does not need to be shared with, or persist beyond, the main product page. Using global state for it was an architectural mismatch.

`ProductDetail` (main page) is **not changed**.

## Implementation

### `src/modules/product/components/product-dialog/product-dialog-item.tsx` — `ProductDialogDetail` only

Remove the `useProductDetailStore` import and all 8 destructured store values. Replace with 4 `useState` declarations initialized from `product` and `groupedVariants`:

```ts
// Helper — computes first-selection defaults from product/groupedVariants
function computeDefaults(
  product: ProductDetailProps["product"],
  groupedVariants: ReturnType<typeof useProductVariants>["groupedVariants"],
) {
  const selectedVariants: Record<string, string> = {};
  const selectedSpec2: Record<string, string> = {};
  let currentImage = product.imgUrl[0] || "";

  Object.entries(groupedVariants).forEach(([specName, variants]) => {
    if (variants && variants.length > 0) {
      const first = variants[0];
      selectedVariants[specName] = first.id;
      if (first.spec1Image) currentImage = first.spec1Image;
      if (first.spec2Combinations?.length > 0) {
        selectedSpec2[first.id] = first.spec2Combinations[0].id;
      }
    }
  });

  return { currentImage, selectedVariants, selectedSpec2 };
}
```

```ts
// In ProductDialogDetail — call computeDefaults once via a single lazy useState,
// then spread into three independent state values:
const { groupedVariants } = useProductVariants(product);
const [currentImage, setCurrentImage] = useState(
  () => computeDefaults(product, groupedVariants).currentImage,
);
const [selectedVariants, setSelectedVariants] = useState(
  () => computeDefaults(product, groupedVariants).selectedVariants,
);
const [selectedSpec2, setSelectedSpec2] = useState(
  () => computeDefaults(product, groupedVariants).selectedSpec2,
);
const [quantity, setQuantity] = useState(1);
```

Each lazy initializer (`() => ...`) is called **only once at mount** by React. `computeDefaults` iterates variants at most three times total at mount — acceptable for a dialog that opens infrequently with a small number of variants.

The initialization `useEffect` block (lines 135–155) is **removed entirely** — lazy `useState` initializers replace it.

All downstream handlers (`handleVariantSelect`, `handleSpec2Select`, `createCartItem`, `handleAddToCart`, `handleBuyNow`, `isDisabled`) use the same local state variables and are otherwise unchanged.

### What is NOT changed

- `product-detail-store.ts` — untouched
- `product-detail.tsx` — untouched
- `ProductDialogItem` (the outer Dialog wrapper) — untouched
- `ProductDialogContentFetcher` — untouched

## Notes

- `computeDefaults` duplicates the logic already in `generateDefaultSelections` inside both `ProductDetail` and `ProductDialogDetail`. Since it's now a module-level helper (not inside a component), the `useCallback` wrapper is no longer needed.
- The dialog re-initializes to defaults every time it opens (new mount). This is the correct behavior — a user reopening the dialog should see default selections, not stale previous ones.
- `useCartStore` is a separate store used for `addItem` and is not affected by this change. Only `useProductDetailStore` is removed from `ProductDialogDetail`.

## Scope

- One file changed: `src/modules/product/components/product-dialog/product-dialog-item.tsx`
- No store changes, no page changes, no interface changes
