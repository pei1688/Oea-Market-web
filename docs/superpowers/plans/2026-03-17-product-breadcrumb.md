# Product Page Breadcrumb Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the collection the user came from in the product page breadcrumb by embedding collection context in the URL (`/collections/[collectionId]/[categorySlug]/product/[productId]`).

**Architecture:** Add a nested product route under the collection path. Pass `collectionId` and `categorySlug` as optional props down to `ProductItem` so navigation links use the new URL. Keep the existing `/product/[productId]` route as a direct-link fallback that queries the product's first collection from the DB.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma ORM, pnpm

---

## Chunk 1: Data layer + component prop changes

### Task 1: Extend `productInclude` with collection data

**Files:**
- Modify: `src/lib/prisma-includes.ts`

- [ ] **Step 1: Add `productCollections` to `productInclude`**

  Replace the current contents of `src/lib/prisma-includes.ts`:

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
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  Run: `pnpm exec tsc --noEmit`
  Expected: No errors. (If there are errors, they will be in callers that destructure the product type — fix them before proceeding.)

- [ ] **Step 3: Commit**

  ```bash
  git add src/lib/prisma-includes.ts
  git commit -m "feat: include productCollections in productInclude for breadcrumb fallback"
  ```

---

### Task 2: Pass collection context through `ProductItem` → `ProductGrid` → `CategoryProductsContent`

**Files:**
- Modify: `src/modules/product/components/product-item.tsx`
- Modify: `src/modules/category-products/components/product-grid.tsx`
- Modify: `src/modules/category-products/ui/view/category-products-content.tsx`

- [ ] **Step 1: Update `ProductItem` to accept optional collection context**

  In `src/modules/product/components/product-item.tsx`, update the `ProductItemProps` interface and the `Link` href:

  ```tsx
  interface ProductItemProps {
    product: ProductListItem;
    priority?: boolean;
    collectionId?: string;
    categorySlug?: string;
  }

  const ProductItem = memo(({ product, priority = false, collectionId, categorySlug }: ProductItemProps) => {
    // ...existing discount logic...

    const href =
      collectionId && categorySlug
        ? `/collections/${collectionId}/${categorySlug}/product/${product.id}`
        : `/product/${product.id}`;

    return (
      <div className="relative aspect-3/4 w-full rounded-sm border bg-neutral-100 transition-all duration-300 hover:border-fuchsia-500 hover:shadow-lg">
        {/* Sale badge */}
        {discountInfo.hasDiscount && (
          <div className="ae-small absolute top-2 left-2 z-10 rounded bg-fuchsia-600 px-2 py-1 text-neutral-100">
            -{product.discountPercentage}%
          </div>
        )}

        <Link href={href} className="flex h-full flex-col">
          {/* rest of JSX unchanged */}
        </Link>
      </div>
    );
  });
  ```

- [ ] **Step 2: Update `ProductGrid` to accept and forward collection context**

  In `src/modules/category-products/components/product-grid.tsx`, update `ProductGridProps` and pass props to `ProductItem`:

  ```tsx
  interface ProductGridProps {
    products: ProductListItem[];
    isPending: boolean;
    collectionId?: string;
    categorySlug?: string;
  }

  const ProductGrid = ({ products, isPending, collectionId, categorySlug }: ProductGridProps) => {
    // ...existing empty/loading states unchanged...

    return (
      <div className="grid grid-cols-2 gap-4 transition-all duration-300 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductItem
            product={product}
            key={product.id}
            collectionId={collectionId}
            categorySlug={categorySlug}
          />
        ))}
      </div>
    );
  };
  ```

- [ ] **Step 3: Update `CategoryProductsContent` to pass collection context to `ProductGrid`**

  In `src/modules/category-products/ui/view/category-products-content.tsx`, the component already receives `collectionId` and `categorySlug` as props. Find the `<ProductGrid>` usage and add the two new props:

  ```tsx
  <ProductGrid
    products={products}
    isPending={isLoading}
    collectionId={collectionId}
    categorySlug={categorySlug}
  />
  ```

- [ ] **Step 4: Verify TypeScript compiles**

  Run: `pnpm exec tsc --noEmit`
  Expected: No errors.

- [ ] **Step 5: Commit**

  ```bash
  git add src/modules/product/components/product-item.tsx \
          src/modules/category-products/components/product-grid.tsx \
          src/modules/category-products/ui/view/category-products-content.tsx
  git commit -m "feat: pass collection context through ProductGrid to ProductItem for new breadcrumb URLs"
  ```

---

## Chunk 2: Page updates

### Task 3: Update fallback product page breadcrumb

> **Depends on Task 1** — `productInclude` must already include `productCollections` before this task runs.

**Files:**
- Modify: `src/app/(shop)/product/[id]/page.tsx`

Note: the route segment folder is `[id]`, not `[productId]`. The param name in the page is `id`.

- [ ] **Step 1: Update the product page to use collection data for breadcrumb**

  Replace the full contents of `src/app/(shop)/product/[id]/page.tsx`:

  ```tsx
  import { getProduct, getProductIds } from "@/action/product";
  import PageBreadcrumb from "@/components/layout/page-breadcrumb";
  import { Separator } from "@/components/ui/separator";
  import ProductAlsoLike from "@/modules/product/components/prodcut-alsolike";
  import ProductDescription from "@/modules/product/components/product-description";
  import ProductDetail from "@/modules/product/components/product-detail/product-detail";

  export const revalidate = 300;

  export async function generateStaticParams() {
    const product = await getProductIds();
    return product.map((p) => ({
      id: p.id,
    }));
  }

  const ProductPage = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const product = await getProduct(id);
    if (!product)
      return (
        <div className="mx-auto mt-16 max-w-7xl px-6 md:mt-32 md:px-0">
          <div className="text-center">
            <div className="text-md text-neutral-500">沒有相關商品資料</div>
          </div>
        </div>
      );

    const firstCollection = product.productCollections?.[0]?.collection;

    return (
      <div className="px-6">
        {firstCollection ? (
          <PageBreadcrumb
            grandparentPage={{
              name: "商品系列",
              href: `/collections`,
            }}
            parentPage={{
              name: firstCollection.name,
              href: `/collections/${firstCollection.id}/全部`,
            }}
          />
        ) : (
          <PageBreadcrumb
            parentPage={{
              name: "商品系列",
              href: `/collections`,
            }}
          />
        )}
        <div className="mx-auto mt-12 max-w-7xl space-y-8">
          <ProductDetail product={product} />
          <Separator className="bg-primary/20 my-8" />
          <ProductDescription description={product.description} />
          <div className="bg-primary/20 h-px w-full" />
          <div className="flex w-full flex-col items-center">
            <h2 className="ae-section-title mb-8">你可能也喜歡</h2>
            <ProductAlsoLike
              categoryId={product.categoryId}
              productId={product.id}
            />
          </div>
        </div>
      </div>
    );
  };

  export default ProductPage;
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  Run: `pnpm exec tsc --noEmit`
  Expected: No errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/(shop)/product/[id]/page.tsx
  git commit -m "feat: show product's first collection in breadcrumb on direct-link product page"
  ```

---

### Task 4: Create new nested product page

**Files:**
- Create: `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/page.tsx`

- [ ] **Step 1: Create the file with the complete implementation**

  Create `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/page.tsx`:

  ```tsx
  import { getCollectionById, getCollections } from "@/action/collection";
  import { getProduct } from "@/action/product";
  import PageBreadcrumb from "@/components/layout/page-breadcrumb";
  import { Separator } from "@/components/ui/separator";
  import ProductAlsoLike from "@/modules/product/components/prodcut-alsolike";
  import ProductDescription from "@/modules/product/components/product-description";
  import ProductDetail from "@/modules/product/components/product-detail/product-detail";

  export const revalidate = 300;

  export async function generateStaticParams() {
    const collections = await getCollections();
    const params: {
      collectionId: string;
      categorySlug: string;
      productId: string;
    }[] = [];

    for (const c of collections) {
      const categorySlugValues = [
        "全部",
        ...Array.from(
          new Set(c.productCollections.map((pc) => pc.product.category.name)),
        ).slice(0, 5),
      ];
      for (const categorySlug of categorySlugValues) {
        for (const pc of c.productCollections) {
          params.push({
            collectionId: c.id,
            categorySlug,
            productId: pc.product.id,
          });
        }
      }
    }

    return params;
  }

  const CollectionProductPage = async ({
    params,
  }: {
    params: Promise<{
      collectionId: string;
      categorySlug: string;
      productId: string;
    }>;
  }) => {
    const { collectionId, categorySlug, productId } = await params;

    const [product, collection] = await Promise.all([
      getProduct(productId),
      getCollectionById(collectionId),
    ]);

    if (!product)
      return (
        <div className="mx-auto mt-16 max-w-7xl px-6 md:mt-32 md:px-0">
          <div className="text-center">
            <div className="text-md text-neutral-500">沒有相關商品資料</div>
          </div>
        </div>
      );

    return (
      <div className="px-6">
        <PageBreadcrumb
          grandparentPage={{
            name: "商品系列",
            href: `/collections`,
          }}
          parentPage={{
            name: collection?.name ?? "商品系列",
            href: `/collections/${collectionId}/${categorySlug}`,
          }}
          currentPageName={product.name}
        />
        <div className="mx-auto mt-12 max-w-7xl space-y-8">
          <ProductDetail product={product} />
          <Separator className="bg-primary/20 my-8" />
          <ProductDescription description={product.description} />
          <div className="bg-primary/20 h-px w-full" />
          <div className="flex w-full flex-col items-center">
            <h2 className="ae-section-title mb-8">你可能也喜歡</h2>
            <ProductAlsoLike
              categoryId={product.categoryId}
              productId={product.id}
            />
          </div>
        </div>
      </div>
    );
  };

  export default CollectionProductPage;
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  Run: `pnpm exec tsc --noEmit`
  Expected: No errors.

- [ ] **Step 3: Verify build succeeds**

  Run: `pnpm build`
  Expected: Build completes without errors. Static pages are generated for the new route.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/(shop)/collections/[collectionId]/[categorySlug]/product/
  git commit -m "feat: add nested product page with collection breadcrumb"
  ```

---

## Manual Verification Checklist

After all tasks complete:

- [ ] Navigate from a collection page (e.g. `/collections/xxx/全部`) → click a product → URL changes to `/collections/xxx/全部/product/yyy` and breadcrumb shows: `首頁 / 商品系列 / {collectionName} / {productName}`
- [ ] Clicking the collection name in the breadcrumb navigates back to the correct collection page
- [ ] Navigate directly to `/product/yyy` → breadcrumb shows the product's first collection
- [ ] Navigate directly to `/product/yyy` for a product with no collection → breadcrumb shows `首頁 / 商品系列 / {productName}`
- [ ] The "你可能也喜歡" section still renders and its product links go to `/product/yyy` (not collection-nested)
