# SEO & Sitemap Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為 Oea Market 電商網站新增 sitemap、robots、動態 metadata、JSON-LD 商品結構化資料與動態 OG 圖片，讓 Google 能正確索引並展示商品資訊。

**Architecture:** 純 Next.js App Router 原生 SEO API，無額外依賴。所有資料透過已快取的現有 server actions 取得（`getProducts`、`getCollections`、`getProduct`、`getCollectionById`）。

**Tech Stack:** Next.js 16 App Router, TypeScript, `next/og` (ImageResponse), schema.org JSON-LD, Prisma (productInclude)

---

## File Map

| 動作 | 檔案 | 用途 |
|------|------|------|
| 修改 | `src/lib/prisma-includes.ts` | 加 `discountPercentage: true`，讓 getProduct 回傳折扣資料 |
| 新增 | `src/app/robots.ts` | 告知爬蟲哪些路由不索引 |
| 修改 | `src/app/sitemap.ts` | 將現有靜態 sitemap 改寫為動態 async 版本 |
| 修改 | `src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx` | 加 `generateMetadata`（title、description、canonical） |
| 修改 | `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/page.tsx` | 加 `generateMetadata` + JSON-LD script |
| 新增 | `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/opengraph-image.tsx` | 商品頁動態 OG 圖片 |
| 修改 | `src/app/(auth)/layout.tsx` | 加 `export const metadata` 設 noindex |
| 修改 | `src/app/(user)/layout.tsx` | 加 `export const metadata` 設 noindex |
| 修改 | `src/app/(shop)/cart/page.tsx` | 加 `export const metadata` 設 noindex |
| 修改 | `src/app/(shop)/checkout/page.tsx` | 加 `export const metadata` 設 noindex |

---

## Task 1: Fix productInclude — 加入 discountPercentage

**Files:**
- Modify: `src/lib/prisma-includes.ts`

**背景：** `productInclude` 目前沒有 select `discountPercentage`，導致後續 JSON-LD 無法取得折扣價。先修此問題再做其他任務。

- [ ] **Step 1: 修改 prisma-includes.ts**

開啟 `src/lib/prisma-includes.ts`，在 `category: true` 之前加入 `discountPercentage: true`：

```ts
export const productInclude = {
  discountPercentage: true,
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

- [ ] **Step 2: 確認 TypeScript 編譯無錯**

```bash
cd C:\Users\PEI\Desktop\NEXTJS\ecommerce-peishop-web
npx tsc --noEmit
```

Expected: 無錯誤（或只有既有錯誤，非新增）

- [ ] **Step 3: Commit**

```bash
git add src/lib/prisma-includes.ts
git commit -m "fix: add discountPercentage to productInclude for JSON-LD price accuracy"
```

---

## Task 2: robots.ts

**Files:**
- Create: `src/app/robots.ts`

- [ ] **Step 1: 新增 robots.ts**

```ts
// src/app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/cart", "/checkout", "/api"],
    },
    sitemap: "https://oea-market-web.vercel.app/sitemap.xml",
  };
}
```

- [ ] **Step 2: 確認 TypeScript 編譯無錯**

```bash
npx tsc --noEmit
```

Expected: 無錯誤

- [ ] **Step 3: Commit**

```bash
git add src/app/robots.ts
git commit -m "feat: add robots.ts to control crawler access"
```

---

## Task 3: sitemap.ts

**Files:**
- Modify: `src/app/sitemap.ts` （已存在靜態版本，需完整替換為 async 動態版本）

**重要細節：**
- `getProducts()` catch block 無 return，可能為 `undefined`，必須用 `?? []`
- `getCollections()` 已保證回傳 `[]`，不需防護
- 商品的 collectionId 取 `product.productCollections[0].collection.id`（非 `.collectionId`）
- 無 productCollections 的商品跳過
- lastModified 靜態頁用固定日期，動態頁用 `updatedAt`

- [ ] **Step 1: 替換 sitemap.ts（原有靜態版本完整覆寫為以下 async 版本）**

```ts
// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { getCollections } from "@/action/collection";
import { getProducts } from "@/action/product";

const BASE_URL = "https://oea-market-web.vercel.app";
const STATIC_DATE = new Date("2025-01-01");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([
    getProducts().then((p) => p ?? []),
    getCollections(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1.0, lastModified: STATIC_DATE },
    { url: `${BASE_URL}/collections`, changeFrequency: "weekly", priority: 0.8, lastModified: STATIC_DATE },
    { url: `${BASE_URL}/news`, changeFrequency: "weekly", priority: 0.6, lastModified: STATIC_DATE },
    { url: `${BASE_URL}/search`, changeFrequency: "monthly", priority: 0.5, lastModified: STATIC_DATE },
  ];

  const collectionPages: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${BASE_URL}/collections/${c.id}/全部`,
    changeFrequency: "daily",
    priority: 0.8,
    lastModified: c.updatedAt ?? STATIC_DATE,
  }));

  const productPages: MetadataRoute.Sitemap = products
    .filter((p) => p.productCollections.length > 0)
    .map((p) => {
      const collectionId = p.productCollections[0].collection.id;
      return {
        url: `${BASE_URL}/collections/${collectionId}/全部/product/${p.id}`,
        changeFrequency: "daily",
        priority: 0.9,
        lastModified: p.updatedAt ?? STATIC_DATE,
      };
    });

  return [...staticPages, ...collectionPages, ...productPages];
}
```

- [ ] **Step 2: 確認 TypeScript 編譯無錯**

```bash
npx tsc --noEmit
```

Expected: 無錯誤

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: add dynamic sitemap covering static pages, collections, and products"
```

---

## Task 4: generateMetadata — Collection 頁

**Files:**
- Modify: `src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx`

**背景：** `getCollectionById` 已在 page component 中透過 `getFilteredProductsByCollection` 間接呼叫，但 `generateMetadata` 直接呼叫 `getCollectionById` 無問題（Next.js 在同一 request 會 deduplicate 已快取的 action）。

- [ ] **Step 1: 加入 generateMetadata**

在 `src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx` 頂部 import 加入：

```ts
import { getCollectionById } from "@/action/collection";
import { type Metadata } from "next";
```

在 `generateStaticParams` 之後、`export default` 之前加入：

```ts
export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { collectionId } = await params;
  const collection = await getCollectionById(collectionId);
  const name = collection?.name ?? "商品系列";
  return {
    title: name,
    description: `瀏覽 ${name} 系列商品，探索 Oea Market 精選代購商品。`,
    alternates: {
      canonical: `/collections/${collectionId}/全部`,
    },
    openGraph: {
      title: `${name} | Oea`,
      description: `瀏覽 ${name} 系列商品，探索 Oea Market 精選代購商品。`,
    },
  };
}
```

- [ ] **Step 2: 確認 TypeScript 編譯無錯**

```bash
npx tsc --noEmit
```

Expected: 無錯誤

- [ ] **Step 3: Commit**

```bash
git add src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx
git commit -m "feat: add generateMetadata to collection page with canonical URL"
```

---

## Task 5: generateMetadata + JSON-LD — 商品頁

**Files:**
- Modify: `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/page.tsx`

**背景：** `getProduct` 已有快取，在 `generateMetadata` 與 page component 中各呼叫一次，Next.js 會自動 deduplicate，不會造成重複 DB 查詢。`calculateDiscountedPrice` 從 `@/lib/price` import。

- [ ] **Step 1: 加入 generateMetadata + JSON-LD**

在 `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/page.tsx` 的 import 加入：

```ts
import { type Metadata } from "next";
import { calculateDiscountedPrice } from "@/lib/price";
```

在 `generateStaticParams` 之後、`CollectionProductPage` 之前加入：

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ collectionId: string; categorySlug: string; productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProduct(productId);
  const title = product?.name ?? "商品";
  const description = product?.description?.slice(0, 120) ?? "";
  return {
    title,
    description,
    openGraph: {
      title: `${title} | Oea`,
      description,
    },
  };
}
```

在 `CollectionProductPage` component 內，`product` 取得後、`return` 前加入 JSON-LD：

```tsx
const discountInfo = calculateDiscountedPrice(
  product.price,
  product.isOnSale,
  product.discountPercentage,
);
const finalPrice = discountInfo.hasDiscount
  ? discountInfo.discountedPrice
  : product.price;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.description,
  image: product.imgUrl ?? [],
  offers: {
    "@type": "Offer",
    priceCurrency: "TWD",
    price: finalPrice,
    availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: {
      "@type": "Organization",
      name: "Oea Market",
    },
    url: `https://oea-market-web.vercel.app/collections/${collectionId}/${categorySlug}/product/${productId}`,
  },
};
```

在 `return (` 的 `<div className="px-6">` 之前（同層）插入：

```tsx
return (
  <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <div className="px-6">
      {/* 原有內容不動 */}
    </div>
  </>
);
```

- [ ] **Step 2: 確認 TypeScript 編譯無錯**

```bash
npx tsc --noEmit
```

Expected: 無錯誤

- [ ] **Step 3: Commit**

```bash
git add src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/page.tsx
git commit -m "feat: add generateMetadata and JSON-LD Product schema to product page"
```

---

## Task 6: 動態 OG 圖片 — 商品頁

**Files:**
- Create: `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/opengraph-image.tsx`

**背景：**
- `next/og` 的 `ImageResponse` 在 Node.js runtime 下運作
- `<img>` src 必須為絕對 https URL，相對路徑無效
- 驗證 `imgUrl[0]` 以 `https://` 開頭後才使用，否則走全寬漸層 fallback

- [ ] **Step 1: 新增 opengraph-image.tsx**

```tsx
// src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { getProduct } from "@/action/product";
import { calculateDiscountedPrice } from "@/lib/price";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  // getProduct() 可能回傳 undefined（catch block 無 return）或 null（findUnique 找不到）
  // 兩種情況都走 fallback（imgUrl = null，displayPrice = 0）
  const product = await getProduct(productId);

  const imgUrl =
    product?.imgUrl?.[0]?.startsWith("https://")
      ? product.imgUrl[0]
      : null;

  let displayPrice = product?.price ?? 0;
  if (product) {
    const info = calculateDiscountedPrice(
      product.price,
      product.isOnSale,
      product.discountPercentage,
    );
    if (info.hasDiscount) displayPrice = info.discountedPrice;
  }

  // Fallback: 無商品圖時全寬漸層
  if (!imgUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(to right, #fcabdd, #b62892)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "white" }}>
            <span style={{ fontSize: 32, opacity: 0.8 }}>Oea Market</span>
            <span style={{ fontSize: 56, fontWeight: "bold", marginTop: 16, textAlign: "center", padding: "0 40px" }}>
              {product?.name ?? "商品"}
            </span>
            <span style={{ fontSize: 40, marginTop: 12, color: "#f9a8d4" }}>
              NT$ {displayPrice}
            </span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* 左半：商品圖片 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgUrl}
          alt=""
          style={{ width: 600, height: 630, objectFit: "cover" }}
        />
        {/* 右半：漸層 + 文字 */}
        <div
          style={{
            width: 600,
            height: 630,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "40px 48px",
            background: "linear-gradient(to bottom right, #fcabdd, #b62892)",
          }}
        >
          <span style={{ fontSize: 24, color: "rgba(255,255,255,0.8)", marginBottom: 16 }}>
            Oea Market
          </span>
          <span
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: "white",
              lineHeight: 1.2,
              marginBottom: 24,
            }}
          >
            {product?.name ?? "商品"}
          </span>
          <span style={{ fontSize: 36, color: "white", fontWeight: "bold" }}>
            NT$ {displayPrice}
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
```

- [ ] **Step 2: 確認 TypeScript 編譯無錯**

```bash
npx tsc --noEmit
```

Expected: 無錯誤

- [ ] **Step 3: Commit**

```bash
git add "src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/opengraph-image.tsx"
git commit -m "feat: add dynamic OG image for product pages using next/og"
```

---

## Task 7: noindex — auth / user / cart / checkout

**Files:**
- Modify: `src/app/(auth)/layout.tsx`
- Modify: `src/app/(user)/layout.tsx`
- Modify: `src/app/(shop)/cart/page.tsx`
- Modify: `src/app/(shop)/checkout/page.tsx`

**背景：** 使用靜態 `export const metadata`（非 `generateMetadata`）即可。`(user)/layout.tsx` 是 async Server Component，靜態 metadata export 與 async default export 完全相容，無衝突。

- [ ] **Step 1: 修改四個檔案**

**`src/app/(auth)/layout.tsx`** — 在 import 後加入：

```ts
import { type Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false },
};
```

**`src/app/(user)/layout.tsx`** — 在 import 後加入：

```ts
import { type Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false },
};
```

**`src/app/(shop)/cart/page.tsx`** — 在 import 後加入：

```ts
import { type Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false },
};
```

**`src/app/(shop)/checkout/page.tsx`** — 在 import 後加入：

```ts
import { type Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false },
};
```

- [ ] **Step 2: 確認 TypeScript 編譯無錯**

```bash
npx tsc --noEmit
```

Expected: 無錯誤

- [ ] **Step 3: Commit**

```bash
git add src/app/(auth)/layout.tsx src/app/(user)/layout.tsx src/app/(shop)/cart/page.tsx src/app/(shop)/checkout/page.tsx
git commit -m "feat: add noindex metadata to auth, user, cart, and checkout pages"
```

---

## Final Verification

- [ ] **Build 確認**

```bash
pnpm build
```

Expected: Build 成功，無 TypeScript 或 Next.js 錯誤

- [ ] **手動確認 sitemap**

啟動 dev server 後瀏覽：`http://localhost:3000/sitemap.xml`
確認：靜態頁、collection 頁、商品頁 URL 皆正確輸出

- [ ] **手動確認 robots**

瀏覽 `http://localhost:3000/robots.txt`
確認：Disallow 規則與 Sitemap URL 正確

- [ ] **手動確認商品頁 OG 圖片**

使用 [https://www.opengraph.xyz/](https://www.opengraph.xyz/) 或 Facebook Sharing Debugger 測試一個商品 URL，確認動態 OG 圖片顯示商品圖 + 名稱 + 價格

- [ ] **手動確認 JSON-LD**

用 [https://validator.schema.org/](https://validator.schema.org/) 測試一個商品 URL，確認 Product schema 通過驗證
