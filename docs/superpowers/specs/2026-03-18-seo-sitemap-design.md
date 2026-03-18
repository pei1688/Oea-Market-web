# SEO & Sitemap 設計文件

**日期：** 2026-03-18
**專案：** ecommerce-peishop-web (Oea Market)
**範圍：** 新增 sitemap.ts、robots.ts、動態 metadata、JSON-LD、動態 OG 圖片

---

## 背景

目前專案缺少以下 SEO 基礎設施：
- 無 `sitemap.ts` / `robots.ts`
- 所有頁面繼承 root layout 的靜態 metadata，無動態標題/描述
- 無 JSON-LD 結構化資料
- OG 圖片為靜態漸層，無商品資訊

目標：讓 Google 能正確索引所有商品與 collection 頁，並在搜尋結果中展示商品名稱、描述與價格。

---

## 架構方向

使用 Next.js App Router 原生 SEO API，無額外依賴。利用現有已快取的 `getProducts()`、`getCollections()`、`getProduct()`、`getCollectionById()` action。

---

## Section 1：Sitemap + Robots

### `app/sitemap.ts`

動態生成，呼叫現有 action：

**靜態頁面：**

| URL | changeFrequency | priority |
|-----|-----------------|----------|
| `/` | weekly | 1.0 |
| `/collections` | weekly | 0.8 |
| `/news` | weekly | 0.6 |
| `/search` | monthly | 0.5 |

**動態頁面：**

| URL 模式 | changeFrequency | priority | 資料來源 |
|----------|-----------------|----------|---------|
| `/collections/[id]/全部` | daily | 0.8 | `getCollections()` |
| `/collections/[collectionId]/全部/product/[productId]` | daily | 0.9 | `getProducts()` + `productCollections[0]` |

商品頁 collectionId 取 `product.productCollections[0].collectionId`（與 breadcrumb fallback 邏輯一致）。若商品無 collection 則跳過。

### `app/robots.ts`

```
User-Agent: *
Allow: /
Disallow: /account
Disallow: /cart
Disallow: /checkout
Disallow: /api
Sitemap: https://oea-market-web.vercel.app/sitemap.xml
```

---

## Section 2：動態 `generateMetadata()`

### Collection 頁
**路徑：** `src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx`

```ts
export async function generateMetadata({ params }) {
  const { collectionId, categorySlug } = await params;
  const collection = await getCollectionById(collectionId);
  return {
    title: collection?.name ?? "商品系列",
    description: `瀏覽 ${collection?.name ?? "商品系列"} 的所有商品。`,
    alternates: {
      canonical: `/collections/${collectionId}/全部`,
    },
    openGraph: {
      title: `${collection?.name ?? "商品系列"} | Oea`,
      description: `瀏覽 ${collection?.name ?? "商品系列"} 的所有商品。`,
    },
  };
}
```

`canonical` 統一指向 `/全部`，避免 categorySlug 產生重複內容問題。

### 商品頁
**路徑：** `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/page.tsx`

```ts
export async function generateMetadata({ params }) {
  const { productId } = await params;
  const product = await getProduct(productId);
  return {
    title: product?.name ?? "商品",
    description: product?.description?.slice(0, 120) ?? "",
    openGraph: {
      title: `${product?.name} | Oea`,
      description: product?.description?.slice(0, 120) ?? "",
      type: "website",
    },
  };
}
```

### noindex 頁面
加入 `robots: { index: false }` metadata 至以下頁面：
- `/cart`
- `/checkout`
- `/account/*`（user group layout）
- `/sign-in`、`/sign-up`（auth group layout）

實作於各自的 layout.tsx 或 page.tsx，使用 `export const metadata`。

---

## Section 3：JSON-LD Product Schema

**路徑：** `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/page.tsx`

在 page 的 JSX 頂層注入：

```tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.description,
  image: product.imgUrl ?? [],
  offers: {
    "@type": "Offer",
    priceCurrency: "TWD",
    price: discountedPrice ?? product.price,
    availability: "https://schema.org/InStock",
    url: `https://oea-market-web.vercel.app/collections/${collectionId}/${categorySlug}/product/${productId}`,
  },
};

// 在 return 最外層加入：
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

價格計算使用現有 `calculateDiscountedPrice()` utility。

---

## Section 4：動態 OG 圖片

**路徑：** `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/opengraph-image.tsx`

使用 Next.js `ImageResponse`（`next/og`）：

**圖片尺寸：** 1200×630px

**版面：**
```
┌─────────────────────────────────────────────────────────┐
│  商品圖片（左半 600px）  │  漸層背景（右半 600px）        │
│  object-cover            │  小標：Oea Market             │
│                          │  商品名稱（大字，白色）         │
│                          │  NT$ {price}（fuchsia #b62892）│
└─────────────────────────────────────────────────────────┘
```

**Fallback：** 若 `product.imgUrl` 為空，改為全寬漸層背景（與現有 opengraph-image 一致）。

**資料來源：** `getProduct(productId)`（已有 unstable_cache 300s）

**其他頁面 OG：** collection 頁、首頁沿用現有靜態漸層 OG 圖，不修改。

---

## 新增/修改檔案清單

| 動作 | 檔案 |
|------|------|
| 新增 | `src/app/sitemap.ts` |
| 新增 | `src/app/robots.ts` |
| 修改 | `src/app/(shop)/collections/[collectionId]/[categorySlug]/page.tsx` — 加 `generateMetadata` |
| 修改 | `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/page.tsx` — 加 `generateMetadata` + JSON-LD |
| 新增 | `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/opengraph-image.tsx` |
| 修改 | `src/app/(auth)/layout.tsx` — 加 noindex metadata |
| 修改 | `src/app/(user)/layout.tsx` — 加 noindex metadata |
| 修改 | `src/app/(shop)/cart/page.tsx` — 加 noindex metadata |
| 修改 | `src/app/(shop)/checkout/page.tsx` — 加 noindex metadata |

---

## 不在範圍內

- collection 頁動態 OG 圖片
- 商品評分 (aggregateRating) JSON-LD（專案無評分功能）
- i18n / hreflang（單語言站）
- 獨立的 `/product/[productId]` 路由 SEO（已刪除，不在 sitemap）
