# Product Page Breadcrumb — Design Spec

**Date:** 2026-03-17
**Status:** Approved

## Goal

When a user navigates from a collection page to a product page, the breadcrumb should reflect the collection they came from:

```
首頁 / 商品系列 / {collectionName} / {productName}
```

## Route Structure

Add a new nested product route under the collection path:

```
src/app/(shop)/collections/
  [collectionId]/
    [categorySlug]/
      page.tsx                      ← existing (collection listing page)
      product/
        [productId]/
          page.tsx                  ← NEW (product page with collection context)

src/app/(shop)/product/
  [productId]/
    page.tsx                        ← KEEP (direct-link fallback)
```

## Navigation Link Changes

`ProductItem` currently links to `/product/${id}`. When rendered inside a collection context, it should link to:

```
/collections/{collectionId}/{categorySlug}/product/{productId}
```

`collectionId` and `categorySlug` are passed down as optional props through the component tree:

```
CategoryProductsContent (has collectionId, categorySlug from params)
  └─ ProductGrid (new: collectionId?, categorySlug?)
       └─ ProductItem (new: collectionId?, categorySlug?)
            └─ Link href (conditional on whether collectionId is present)
```

When `collectionId` is absent (e.g. `ProductAlsoLike` section, home page), `ProductItem` falls back to `/product/${id}` as before. `ProductAlsoLike` uses `ProductItem` without these props and requires no changes.

## New Product Page — `/collections/[collectionId]/[categorySlug]/product/[productId]`

- Reads `collectionId`, `categorySlug`, and `productId` from `params`
- Fetches collection name via a new `getCollectionById(collectionId)` server action (see Data Changes)
- Fetches product via existing `getProduct(productId)`
- Renders `PageBreadcrumb` with:
  - `grandparentPage`: `{ name: "商品系列", href: "/collections" }`
  - `parentPage`: `{ name: collectionName, href: "/collections/{collectionId}/{categorySlug}" }` — uses actual `categorySlug` from params
  - `currentPageName`: product name
- Renders the same product content as the existing product page (reuse components)
- `categorySlug` is not validated against `collectionId`; mismatched URLs render as-is (breadcrumb link may be stale but page is functional)

### `generateStaticParams`

Enumerate only valid (collectionId, categorySlug, productId) triples by iterating the `productCollections` join table:

```ts
export async function generateStaticParams() {
  const collections = await getCollections();
  const params: { collectionId: string; categorySlug: string; productId: string }[] = [];

  for (const c of collections) {
    const categorySlugValues = [
      "全部",
      ...Array.from(new Set(c.productCollections.map((pc) => pc.product.category.name))).slice(0, 5),
    ];
    for (const categorySlug of categorySlugValues) {
      for (const pc of c.productCollections) {
        params.push({ collectionId: c.id, categorySlug, productId: pc.product.id });
      }
    }
  }
  return params;
}
```

This mirrors the existing pattern in the collection page's `generateStaticParams`.

## Existing Product Page — `/product/[productId]` (Fallback)

For users who arrive via direct URL, search results, or non-collection entry points:

- Uses `product.productCollections[0]` from the extended `productInclude` (see Data Changes)
- Renders `PageBreadcrumb`:
  - If collection exists:
    - `grandparentPage`: `{ name: "商品系列", href: "/collections" }`
    - `parentPage`: `{ name: collection.name, href: "/collections/{collection.id}/全部" }`
    - `currentPageName`: product name
  - If no collection exists:
    - `parentPage`: `{ name: "商品系列", href: "/collections" }`
    - `currentPageName`: product name

## Data Changes

### New server action — `getCollectionById`

Add to `src/action/collection/get.ts`:

```ts
export async function getCollectionById(collectionId: string) {
  return prisma.collection.findUnique({
    where: { id: collectionId },
    select: { id: true, name: true },
  });
}
```

Export from `src/action/collection/index.ts`.

### Extend `productInclude`

`src/lib/prisma-includes.ts` — add `productCollections`:

```ts
export const productInclude = {
  category: true,
  variants: { include: { spec2Combinations: true } },
  productCollections: {
    take: 1,
    include: { collection: { select: { id: true, name: true } } },
  },
} satisfies Prisma.ProductInclude;
```

**Impact on existing callers:** Adding `productCollections` changes the inferred TypeScript type of every value returned by `getProduct` and `getProducts`. All existing callers must be checked to ensure they compile without errors. No runtime behavior changes are expected since callers currently ignore collection data.

## Files to Change

| File | Change |
|------|--------|
| `src/lib/prisma-includes.ts` | Add `productCollections` include |
| `src/action/collection/get.ts` | Add `getCollectionById` action |
| `src/action/collection/index.ts` | Export `getCollectionById` |
| `src/modules/product/components/product-item.tsx` | Add optional `collectionId`, `categorySlug` props; conditional href |
| `src/modules/category-products/components/product-grid.tsx` | Pass `collectionId`, `categorySlug` to `ProductItem` |
| `src/modules/category-products/ui/view/category-products-content.tsx` | Pass `collectionId`, `categorySlug` to `ProductGrid` |
| `src/app/(shop)/product/[productId]/page.tsx` | Use first collection from product data for breadcrumb fallback |
| `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/page.tsx` | **New file** — product page with collection context |

## Out of Scope

- Changing breadcrumbs on any pages other than the product page
- Adding a slug field to the Collection model
- Redirecting old `/product/[id]` URLs to the new nested route
- Validating that `categorySlug` belongs to the given `collectionId`
