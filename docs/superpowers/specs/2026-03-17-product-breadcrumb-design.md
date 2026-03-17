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

When `collectionId` is absent (e.g. "you may also like" section), `ProductItem` falls back to `/product/${id}` as before.

## New Product Page — `/collections/[collectionId]/[categorySlug]/product/[productId]`

- Reads `collectionId` and `productId` from `params`
- Fetches collection name via existing `getCollections` or a new `getCollection(collectionId)` action
- Fetches product via existing `getProduct(productId)`
- Renders `PageBreadcrumb` with:
  - `grandparentPage`: `{ name: "商品系列", href: "/collections" }`
  - `parentPage`: `{ name: collectionName, href: "/collections/{collectionId}/全部" }`
  - `currentPageName`: product name
- Renders the same product content as the existing product page (reuse components)
- Uses `generateStaticParams` to pre-render all valid (collectionId, categorySlug, productId) combinations

## Existing Product Page — `/product/[productId]` (Fallback)

For users who arrive via direct URL, search results, or non-collection entry points:

- Modify `productInclude` to also include `productCollections { collection { id, name } }`
- Use the first collection in `product.productCollections` for the breadcrumb
- If the product has no collection, show only `首頁 / 商品系列 / {productName}`

## Data Changes

`prisma-includes.ts` — extend `productInclude`:

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

## Files to Change

| File | Change |
|------|--------|
| `src/lib/prisma-includes.ts` | Add `productCollections` include |
| `src/modules/product/components/product-item.tsx` | Add optional `collectionId`, `categorySlug` props; conditional href |
| `src/modules/category-products/components/product-grid.tsx` | Pass `collectionId`, `categorySlug` to `ProductItem` |
| `src/modules/category-products/ui/view/category-products-content.tsx` | Pass `collectionId`, `categorySlug` to `ProductGrid` |
| `src/app/(shop)/product/[productId]/page.tsx` | Use first collection from product data for breadcrumb fallback |
| `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/page.tsx` | **New file** — product page with collection context |

## Out of Scope

- Changing breadcrumbs on any pages other than the product page
- Adding a slug field to the Collection model
- Redirecting old `/product/[id]` URLs to the new nested route
