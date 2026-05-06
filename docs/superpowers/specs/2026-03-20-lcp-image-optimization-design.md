# LCP Image Optimization Design

**Date:** 2026-03-20
**Status:** Approved

## Problem

CategoryProductsContent LCP is critically slow:

- Time to first byte: 1,920ms
- Resource load delay: 1,720ms (dominant issue)
- Resource load duration: 10ms
- Element render delay: 90ms

Root causes:
1. `page.tsx` (server component) fetches `initialData` but discards it — `CategoryProductsContent` refetches on the client, delaying images by the full round-trip time
2. Every `ProductItem` sets `priority={true}`, causing all images to preload simultaneously and compete for bandwidth
3. Product images are proxied through `/_next/image` even though Cloudinary already provides a CDN with native transformations

## Solution Overview

**Approach B:** Pass server initialData through + fix priority + Cloudinary Loader

## Part 1: initialData Flow

### Changes

**`src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx`**
- Change server-side fetch from `getFilteredProductsByCollection` to `getInfiniteFilteredProductsByCollection` so the returned type is `InfiniteFilteredProductsResult` (which has `nextCursor`, `products`, `totalCount`, etc.)
- Pass the result to `<CategoryProductsContent initialData={initialData} />`

**`src/modules/category-products/ui/view/category-products-content.tsx`**
- Add `initialData?: InfiniteFilteredProductsResult` to `CategoryProductsContentProps`
- Forward it to `useInfiniteFilteredProductsByCollection`

**`src/services/products.ts` — `useInfiniteFilteredProductsByCollection`**
- Add `InfiniteFilteredProductsResult` to the import from `@/action/product`
- Add `initialData?: InfiniteFilteredProductsResult` to `UseInfiniteFilteredProductsOptions`
- Pass it to `useInfiniteQuery`:
  ```ts
  initialData: initialData
    ? { pages: [initialData], pageParams: [undefined] }
    : undefined,
  initialDataUpdatedAt: initialData ? Date.now() : undefined,
  ```
  `initialDataUpdatedAt` is required — without it, React Query treats the data as infinitely stale and fires an immediate background refetch on mount, negating the benefit.

### Why `InfiniteFilteredProductsResult` (not `FilteredProductsResult`)

`FilteredProductsResult` (from `getFilteredProductsByCollection`) uses offset pagination and has no `nextCursor` field. The infinite query's `getNextPageParam` reads `lastPage.nextCursor` — passing `FilteredProductsResult` would silently break pagination after the first page. `InfiniteFilteredProductsResult` (from `getInfiniteFilteredProductsByCollection`) is the correct shape.

### Expected outcome
First render has product data immediately. Images begin loading as soon as HTML arrives — eliminating the 1,720ms Resource Load Delay.

## Part 2: priority Fix

### Changes

**`src/modules/category-products/components/product-grid.tsx`**
- Pass `index` prop to each `ProductItem`

**`src/modules/product/components/product-item.tsx`**
- Accept `index?: number` prop
- Set `priority={index !== undefined && index < 4}` (first row on desktop: 4-col grid)
- Set `loading={index !== undefined && index >= 4 ? "lazy" : undefined}` for the rest

### Trade-off note

The grid is `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`. On mobile (2 columns), only indices 0–1 are above the fold; indices 2–3 get preloaded unnecessarily. This is accepted as a conservative safe choice — preloading 2 extra images on mobile causes minor bandwidth overhead but avoids the risk of under-loading on larger viewports. A more precise responsive threshold is considered out of scope.

### Expected outcome
Only the first-row images are preloaded. Remaining images are lazy-loaded, reducing bandwidth competition.

## Part 3: Cloudinary Loader

The loader is applied **per-component** (via the `loader` prop on `<Image>`), NOT globally in `next.config.ts`. A global custom loader would disable `/_next/image` for the entire app, breaking non-Cloudinary images (UploadThing: `vnhm1ui6mh.ufs.sh`, `utfs.io`) that appear on other pages.

### New file: `src/lib/cloudinary-loader.ts`

```ts
import { ImageLoaderProps } from "next/image";

export default function cloudinaryLoader({
  src,
  width,
  quality = 75,
}: ImageLoaderProps): string {
  // src is a full Cloudinary URL like:
  // https://res.cloudinary.com/{cloud}/image/upload/v.../path.jpg
  const uploadIndex = src.indexOf("/upload/");
  if (uploadIndex === -1) return src; // passthrough for non-Cloudinary URLs

  const base = src.slice(0, uploadIndex + 8); // includes "/upload/"
  const rest = src.slice(uploadIndex + 8);

  return `${base}w_${width},q_${quality},f_auto/${rest}`;
}
```

### `src/modules/product/components/product-item.tsx`
- Import `cloudinaryLoader` and pass it as the `loader` prop to `<Image>`:
  ```tsx
  <Image
    loader={cloudinaryLoader}
    src={product.imgUrl?.[0] || "/default-product.png"}
    ...
  />
  ```
- The fallback `/default-product.png` is a local path with no `/upload/` segment — the loader's guard (`if (uploadIndex === -1) return src`) handles it correctly.

### `next.config.ts`
- No loader changes needed. Keep `remotePatterns` as-is.
- Increase `minimumCacheTTL` from `3600` to `86400` (24h) for local Next.js image cache.

### Expected outcome
Product images are served directly from Cloudinary CDN with `w_`, `q_`, `f_auto` transformations. Removes the `/_next/image` proxy hop for product images only. Other images on the site are unaffected.

## Files Changed

| File | Change |
|------|--------|
| `src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx` | Switch to `getInfiniteFilteredProductsByCollection`, pass `initialData` to content component |
| `src/services/products.ts` | Add `initialData` + `initialDataUpdatedAt` to infinite query hook |
| `src/modules/category-products/ui/view/category-products-content.tsx` | Accept + forward `initialData` |
| `src/modules/category-products/components/product-grid.tsx` | Pass `index` to ProductItem |
| `src/modules/product/components/product-item.tsx` | Use `index` for conditional priority; add `cloudinaryLoader` |
| `src/lib/cloudinary-loader.ts` | New Cloudinary loader file |
| `next.config.ts` | Increase `minimumCacheTTL` to 86400 |

## Out of Scope

- Refactoring CategoryProductsContent to a Server Component (future work)
- Changing infinite scroll behavior
- Applying Cloudinary loader globally (other pages have non-Cloudinary images)
