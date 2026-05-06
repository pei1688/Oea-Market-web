# SEO & Sitemap 設計文件

**日期：** 2026-03-18（修訂：2026-03-19）
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

### `src/app/sitemap.ts`

動態生成，呼叫現有 action。

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
| `/collections/[collectionId]/全部/product/[productId]` | daily | 0.9 | `getProducts()` |

**重要實作細節：**

- 商品頁 `collectionId` 取 `product.productCollections[0].collection.id`（非 `.collectionId`，實際 Prisma include 回傳的是 `collection.id`）
- 若商品的 `productCollections` 為空，跳過該商品（不加入 sitemap）
- sitemap 只收錄 `/全部` slug，category filter 頁（如 `/上衣`）不收錄（見下方說明）
- `getProducts()` 可能回傳 `undefined`（catch block 無 return），必須加防護。注意：`getCollections()` 的 catch block 已有 `return []`，不需要防護，但加上無害：

```ts
const products = (await getProducts()) ?? [];  // 必要：getProducts catch block 無 return
const collections = await getCollections();    // getCollections 已保證回傳 []
```

- `lastModified`：使用各資料的 `updatedAt` 欄位（若存在），靜態頁使用固定日期（非 `new Date()`），避免每次 sitemap 請求都觸發 Google 重新爬取

**Category filter 頁處理：**

`/collections/[id]/[categorySlug]` 中非 `全部` 的 slug（如 `/上衣`、`/褲子`）是篩選視圖，屬於重複內容。這些頁面：
1. 不加入 sitemap
2. 在 collection page 的 `generateMetadata` 加入 `canonical` 指向 `/全部` 版本

### `src/app/robots.ts`

```
User-Agent: *
Allow: /
Disallow: /account   # 涵蓋 /account/profile, /account/address, /account/order, /account/order/success 等所有子路由
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

`canonical` 統一指向 `/全部`，避免 categorySlug 變體產生重複內容問題。description 使用固定模板（collection 無自訂描述欄位）。

### 商品頁
**路徑：** `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/page.tsx`

```ts
export async function generateMetadata({ params }) {
  const { collectionId, categorySlug, productId } = await params;
  const product = await getProduct(productId);
  const title = product?.name ?? "商品";
  const description = product?.description?.slice(0, 120) ?? "";
  return {
    title,
    description,
    openGraph: {
      title: `${title} | Oea`,
      description,
      // type 繼承 root layout 的 "website"，無需重複設定
    },
  };
}
```

### noindex 頁面

以下頁面加入 `robots: { index: false }`。使用靜態 `export const metadata`（非 `generateMetadata`），因為這些 layout/page 不需要動態資料，靜態 export 最簡單且無副作用：

```ts
export const metadata: Metadata = {
  robots: { index: false },
};
```

加入位置：
- `src/app/(auth)/layout.tsx` — 涵蓋 `/sign-in`、`/sign-up`
- `src/app/(user)/layout.tsx` — 涵蓋所有 `/account/*`。注意：此 layout 是 `async` Server Component（呼叫 `requireAuth()`），但靜態 `export const metadata` 與 async default export 可共存，無衝突
- `src/app/(shop)/cart/page.tsx`
- `src/app/(shop)/checkout/page.tsx`

---

## Section 3：JSON-LD Product Schema

**路徑：** `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/page.tsx`

在 page component 的 return JSX 最外層注入：

**前置條件：** `productInclude`（`src/lib/prisma-includes.ts`）目前未 select `discountPercentage` 欄位，導致 `product.discountPercentage` 為 `undefined`，`calculateDiscountedPrice` 永遠回傳原價。實作時必須將 `discountPercentage: true` 加入 `productInclude`。

```tsx
const discountInfo = calculateDiscountedPrice(
  product.price,
  product.isOnSale,
  product.discountPercentage, // 需確認 productInclude 有 select 此欄位
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

// 在 return 最外層加入：
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

**注意：**
- `availability` 必須使用完整 schema.org URI（`"https://schema.org/InStock"`），非簡短字串
- `itemCondition` 設為 `"https://schema.org/NewCondition"`
- `seller` 加入 Organization 確保 Google Rich Results 資格

---

## Section 4：動態 OG 圖片

**路徑：** `src/app/(shop)/collections/[collectionId]/[categorySlug]/product/[productId]/opengraph-image.tsx`

使用 `next/og` 的 `ImageResponse`。

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

**Runtime：** 預設 Node.js runtime（無需指定 `edge`，`ImageResponse` 在 Node runtime 下同樣支援）

**遠端圖片 URL 處理（重要）：**
- 商品圖片儲存於 CDN（`vnhm1ui6mh.ufs.sh` / `utfs.io` / `res.cloudinary.com`）
- `ImageResponse` 中的 `<img>` 必須使用**絕對 URL**，相對路徑無效
- 取 `product.imgUrl?.[0]`，確認為完整 https URL 後才使用；若為空或非 http 開頭，走 fallback
- Fallback：全寬漸層背景 + 文字（與現有靜態 opengraph-image 一致）

**Collection 頁 OG 圖片：** 不新增 collection 專屬 OG 圖，沿用現有 `src/app/(shop)/opengraph-image.tsx` 的靜態漸層設計。此為刻意決策，collection 頁非商品轉換入口，無需動態 OG。

---

## 新增/修改檔案清單

| 動作 | 檔案 |
|------|------|
| 修改 | `src/lib/prisma-includes.ts` — 加 `discountPercentage: true` |
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

- Collection 頁動態 OG 圖片（刻意排除）
- 商品評分 (aggregateRating) JSON-LD（專案無評分功能）
- i18n / hreflang（單語言站）
- 獨立的 `/product/[productId]` 路由 SEO（已刪除，不在 sitemap）
- `priceValidUntil`（代購商品價格無固定有效期，不適用）
