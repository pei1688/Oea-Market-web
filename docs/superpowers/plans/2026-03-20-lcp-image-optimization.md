# LCP Image Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the 1,720ms Resource Load Delay on the CategoryProductsContent page by passing server-fetched initialData to the client, fix image priority overloading, and serve product images directly from Cloudinary CDN.

**Architecture:** Server component (`page.tsx`) calls `getInfiniteFilteredProductsByCollection` and passes the result as `initialData` to the client component, which wires it into React Query's `useInfiniteQuery`. Product images use a component-level Cloudinary loader to bypass the `/_next/image` proxy, and only the first 4 images get `priority={true}`.

**Tech Stack:** Next.js 14 App Router, React Query (TanStack Query `useInfiniteQuery`), Cloudinary CDN, TypeScript, pnpm

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/cloudinary-loader.ts` | **Create** | Cloudinary image loader function |
| `src/services/products.ts` | **Modify** | Add `initialData` + `initialDataUpdatedAt` to infinite query hook |
| `src/modules/category-products/ui/view/category-products-content.tsx` | **Modify** | Accept and forward `initialData` prop |
| `src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx` | **Modify** | Switch to correct server action, pass `initialData` |
| `src/modules/category-products/components/product-grid.tsx` | **Modify** | Pass `index` to each `ProductItem` |
| `src/modules/product/components/product-item.tsx` | **Modify** | Add `index` prop, conditional priority, Cloudinary loader |
| `next.config.ts` | **Modify** | Increase `minimumCacheTTL` |

---

## Task 1: Create Cloudinary Loader

**Files:**
- Create: `src/lib/cloudinary-loader.ts`

This is a pure function — easy to verify by reading the output.

- [ ] **Step 1: Create the loader file**

```ts
// src/lib/cloudinary-loader.ts
import { ImageLoaderProps } from "next/image";

export default function cloudinaryLoader({
  src,
  width,
  quality = 75,
}: ImageLoaderProps): string {
  // src is a full Cloudinary URL:
  // https://res.cloudinary.com/{cloud}/image/upload/v.../path.jpg
  const uploadIndex = src.indexOf("/upload/");
  if (uploadIndex === -1) return src; // passthrough for non-Cloudinary (local paths, UploadThing, etc.)

  const base = src.slice(0, uploadIndex + 8); // includes "/upload/"
  const rest = src.slice(uploadIndex + 8);

  return `${base}w_${width},q_${quality},f_auto/${rest}`;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors related to `cloudinary-loader.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/cloudinary-loader.ts
git commit -m "feat: add Cloudinary image loader"
```

---

## Task 2: Add initialData to the Infinite Query Hook

**Files:**
- Modify: `src/services/products.ts` (lines 136–207)

The `UseInfiniteFilteredProductsOptions` interface currently has no `initialData`. We add it and wire it into `useInfiniteQuery`.

- [ ] **Step 1: Add `InfiniteFilteredProductsResult` to the import**

In `src/services/products.ts`, the first import block starts at line 1. Find the line:
```ts
import {
  getProduct,
  getProductsByCollectionId,
  getRelatedProducts,
  getFilteredProductsByCollection,
  getInfiniteFilteredProductsByCollection,
  type ProductFilterParams,
  type FilteredProductsResult,
  type InfiniteProductFilterParams,
} from "@/action/product";
```

Add `type InfiniteFilteredProductsResult` to the import:
```ts
import {
  getProduct,
  getProductsByCollectionId,
  getRelatedProducts,
  getFilteredProductsByCollection,
  getInfiniteFilteredProductsByCollection,
  type ProductFilterParams,
  type FilteredProductsResult,
  type InfiniteProductFilterParams,
  type InfiniteFilteredProductsResult,
} from "@/action/product";
```

- [ ] **Step 2: Add `initialData` to the options interface**

Find `UseInfiniteFilteredProductsOptions` (around line 136):
```ts
interface UseInfiniteFilteredProductsOptions extends Omit<
  InfiniteProductFilterParams,
  "collectionId" | "cursor"
> {
  collectionId: string;
  enabled?: boolean;
}
```

Add the `initialData` field:
```ts
interface UseInfiniteFilteredProductsOptions extends Omit<
  InfiniteProductFilterParams,
  "collectionId" | "cursor"
> {
  collectionId: string;
  enabled?: boolean;
  initialData?: InfiniteFilteredProductsResult;
}
```

- [ ] **Step 3: Destructure `initialData` in the hook and pass to `useInfiniteQuery`**

Find the `useInfiniteFilteredProductsByCollection` function. The destructuring currently reads:
```ts
}: UseInfiniteFilteredProductsOptions) => {
```

Update the full destructure to include `initialData`:
```ts
  collectionId,
  categorySlug,
  categories,
  brands,
  sortBy,
  limit = 8,
  enabled = true,
  initialData,
}: UseInfiniteFilteredProductsOptions) => {
```

Then in `useInfiniteQuery(...)`, add `initialData` and `initialDataUpdatedAt` after `retry: 1`:
```ts
    retry: 1,
    refetchOnWindowFocus: false,
    initialData: initialData
      ? { pages: [initialData], pageParams: [undefined] }
      : undefined,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
```

**Why `initialDataUpdatedAt`:** Without it, React Query treats the data as infinitely stale and fires an immediate background refetch on mount — negating the entire benefit of passing server data.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no type errors

- [ ] **Step 5: Commit**

```bash
git add src/services/products.ts
git commit -m "feat: add initialData support to useInfiniteFilteredProductsByCollection"
```

---

## Task 3: Thread initialData Through CategoryProductsContent

**Files:**
- Modify: `src/modules/category-products/ui/view/category-products-content.tsx`

- [ ] **Step 1: Add the import for `InfiniteFilteredProductsResult`**

At the top of the file, add to the existing imports:
```ts
import { type InfiniteFilteredProductsResult } from "@/action/product";
```

- [ ] **Step 2: Add `initialData` to `CategoryProductsContentProps`**

Find:
```ts
interface CategoryProductsContentProps {
  collectionId: string;
  categorySlug?: string;
}
```

Change to:
```ts
interface CategoryProductsContentProps {
  collectionId: string;
  categorySlug?: string;
  initialData?: InfiniteFilteredProductsResult;
}
```

- [ ] **Step 3: Destructure and forward `initialData`**

Find:
```ts
const CategoryProductsContent = ({
  collectionId,
  categorySlug,
}: CategoryProductsContentProps) => {
```

Change to:
```ts
const CategoryProductsContent = ({
  collectionId,
  categorySlug,
  initialData,
}: CategoryProductsContentProps) => {
```

Then find the `useInfiniteFilteredProductsByCollection` call and add `initialData`:
```ts
  const {
    products,
    totalCount,
    availableFilters,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteFilteredProductsByCollection({
    collectionId,
    ...filterParams,
    initialData,
  });
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no type errors

- [ ] **Step 5: Commit**

```bash
git add src/modules/category-products/ui/view/category-products-content.tsx
git commit -m "feat: accept and forward initialData in CategoryProductsContent"
```

---

## Task 4: Feed initialData From the Server Page

**Files:**
- Modify: `src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx`

Currently `page.tsx` calls `getFilteredProductsByCollection` (offset-pagination, no `nextCursor`). We must switch to `getInfiniteFilteredProductsByCollection` to get the correct `InfiniteFilteredProductsResult` shape.

- [ ] **Step 1: Update the import on line 3**

Find:
```ts
import { getFilteredProductsByCollection } from "@/action/product";
```

Change to:
```ts
import { getInfiniteFilteredProductsByCollection } from "@/action/product";
```

- [ ] **Step 2: Update the server-side fetch call (around line 54–59)**

Find:
```ts
  const initialData = await getFilteredProductsByCollection({
    collectionId,
    categorySlug: decodeURIComponent(categorySlug),
  });
```

Change to:
```ts
  const initialData = await getInfiniteFilteredProductsByCollection({
    collectionId,
    categorySlug: decodeURIComponent(categorySlug),
  });
```

- [ ] **Step 3: Pass `initialData` to `CategoryProductsContent`**

Find:
```tsx
        <CategoryProductsContent
          collectionId={collectionId}
          categorySlug={categorySlug}
        />
```

Change to:
```tsx
        <CategoryProductsContent
          collectionId={collectionId}
          categorySlug={categorySlug}
          initialData={initialData}
        />
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no type errors

- [ ] **Step 5: Smoke test in browser**

Start the dev server: `pnpm dev`

Navigate to any collection page (e.g. `/collections/[id]/全部`). Open DevTools → Network tab. Confirm:
- The page HTML already contains product names (not blank)
- No second API call to the products action fires immediately on page load
- Product images begin loading without a client-side delay

- [ ] **Step 6: Commit**

```bash
git add src/app/\(shop\)/collections/\[collectionId\]/\[categorySlug\]/page.tsx
git commit -m "feat: pass server initialData to CategoryProductsContent, fix LCP resource load delay"
```

---

## Task 5: Fix Image Priority — Pass index From ProductGrid

**Files:**
- Modify: `src/modules/category-products/components/product-grid.tsx`

- [ ] **Step 1: Add `index` to the `ProductItem` render**

Find:
```tsx
      {products.map((product) => (
        <ProductItem
          product={product}
          key={product.id}
          collectionId={collectionId}
          categorySlug={categorySlug}
        />
      ))}
```

Change to:
```tsx
      {products.map((product, index) => (
        <ProductItem
          product={product}
          key={product.id}
          collectionId={collectionId}
          categorySlug={categorySlug}
          index={index}
        />
      ))}
```

- [ ] **Step 2: Verify TypeScript compiles (will fail until Task 6 adds the prop)**

```bash
pnpm tsc --noEmit
```

Expected: type error on `index` prop — this is expected. Proceed to Task 6 to fix it.

---

## Task 6: Update ProductItem — Conditional Priority + Cloudinary Loader

**Files:**
- Modify: `src/modules/product/components/product-item.tsx`

- [ ] **Step 1: Add import for cloudinaryLoader**

At the top of the file, add:
```ts
import cloudinaryLoader from "@/lib/cloudinary-loader";
```

- [ ] **Step 2: Add `index` to `ProductItemProps`**

Find:
```ts
interface ProductItemProps {
  product: ProductListItem;
  collectionId?: string;
  categorySlug?: string;
}
```

Change to:
```ts
interface ProductItemProps {
  product: ProductListItem;
  collectionId?: string;
  categorySlug?: string;
  index?: number;
}
```

- [ ] **Step 3: Destructure `index` in the component**

Find:
```ts
  ({ product, collectionId, categorySlug }: ProductItemProps) => {
```

Change to:
```ts
  ({ product, collectionId, categorySlug, index }: ProductItemProps) => {
```

- [ ] **Step 4: Update the `<Image>` element**

Find:
```tsx
            <Image
              src={product.imgUrl?.[0] || "/default-product.png"}
              alt={product.name}
              className="rounded-t-sm object-cover duration-300"
              sizes="(max-width: 640px) 100vw,(max-width: 1024px) 50vw,(max-width: 1536px) 33vw,25vw"
              fill
              priority
            />
```

Change to:
```tsx
            <Image
              loader={cloudinaryLoader}
              src={product.imgUrl?.[0] || "/default-product.png"}
              alt={product.name}
              className="rounded-t-sm object-cover duration-300"
              sizes="(max-width: 640px) 100vw,(max-width: 1024px) 50vw,(max-width: 1536px) 33vw,25vw"
              fill
              priority={index === undefined || index < 4}
              loading={index !== undefined && index >= 4 ? "lazy" : undefined}
            />
```

Note: `loader={cloudinaryLoader}` is component-scoped — it does NOT affect other `<Image>` components on other pages. The fallback `/default-product.png` has no `/upload/` in its path, so the loader returns it unchanged.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Verify in browser**

Open the collection page. Open DevTools → Elements tab. Find a product `<img>` tag. Confirm:
- `src` attribute now points directly to `res.cloudinary.com/...` (NOT `/_next/image?url=...`)
- First 4 images have `loading="eager"` (or no `loading` attr); images 5+ have `loading="lazy"`

- [ ] **Step 7: Commit**

```bash
git add src/modules/category-products/components/product-grid.tsx src/modules/product/components/product-item.tsx
git commit -m "perf: conditional priority for product images, add Cloudinary loader"
```

---

## Task 7: Increase minimumCacheTTL in next.config.ts

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Update `minimumCacheTTL`**

Find:
```ts
    minimumCacheTTL: 3600,
```

Change to:
```ts
    minimumCacheTTL: 86400,
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "perf: increase image cache TTL to 24h"
```

---

## Task 8: Final Verification

- [ ] **Step 1: Run full build to confirm no errors**

```bash
pnpm build
```

Expected: build completes with no TypeScript or Next.js errors

- [ ] **Step 2: Measure LCP improvement**

Open Chrome DevTools → Lighthouse tab → run Performance audit on a collection page.

Before (baseline from the issue):
- Resource load delay: ~1,720ms

After target:
- Resource load delay: <200ms (images start loading with the initial HTML)
- `img.src` should show `res.cloudinary.com/...` directly

Alternatively use Chrome DevTools → Performance panel and look for the LCP element timing under the Timings section.
