# Filter Local State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 點擊 filter checkbox 後立即開始 fetch，不需等待 Next.js RSC round-trip。

**Architecture:** 在 `CategoryProductsContent` 加入 `useState` 管理 filter 狀態，React Query 改用 local state 作為 queryKey（立即觸發 fetch）；`router.replace` 在背景同步 URL；`useEffect` 偵測瀏覽器 back/forward 並重新同步 local state。

**Tech Stack:** Next.js 14 App Router, React 18, TanStack Query, TypeScript

---

## Files Modified

| File | 變更 |
|------|------|
| `src/modules/category-products/ui/view/category-products-content.tsx` | 全部邏輯改寫 |

---

## Task 1: 重寫 CategoryProductsContent

**Files:**
- Modify: `src/modules/category-products/ui/view/category-products-content.tsx`

- [ ] **Step 1: 讀目前檔案確認內容**

確認目前 import 清單：
```
useState, useMemo  ← useMemo 之後會移除
buildClearedFilters, buildUpdatedFilters, buildUpdatedSort  ← 之後移除
```

- [ ] **Step 2: 完整替換為下方新版本**

將整個檔案內容替換為：

```tsx
"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useInfiniteFilteredProductsByCollection } from "@/services/products";
import { type InfiniteFilteredProductsResult } from "@/action/product";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import PageHeader from "@/modules/category-products/components/page-header";
import Toolbar from "@/modules/category-products/components/toolbar";
import ProductGrid from "@/modules/category-products/components/product-grid";
import dynamic from "next/dynamic";
import DesktopFilters from "../../components/desktop-filters";
import { Spinner } from "@/components/spinner";

const MobileFilters = dynamic(
  () => import("@/modules/category-products/components/mobile-filters"),
  { ssr: false },
);

interface CategoryProductsContentProps {
  collectionId: string;
  categorySlug?: string;
  initialData?: InfiniteFilteredProductsResult;
}

// 從 localFilters 建構 URL query string（不依賴 searchParams，避免 stale URL 問題）
function buildUrlFromFilters(filters: {
  categories: string[];
  brands: string[];
  sortBy: string;
}): string {
  const params = new URLSearchParams();
  if (filters.categories.length > 0) params.set("categories", filters.categories.join(","));
  if (filters.brands.length > 0) params.set("brands", filters.brands.join(","));
  if (filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);
  return params.toString();
}

const CategoryProductsContent = ({
  collectionId,
  categorySlug,
  initialData,
}: CategoryProductsContentProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter 本地狀態：初始值從 URL 讀取，之後以 local state 為主
  const [localFilters, setLocalFilters] = useState({
    categories: searchParams.get("categories")?.split(",").filter(Boolean) || [],
    brands: searchParams.get("brands")?.split(",").filter(Boolean) || [],
    sortBy: searchParams.get("sortBy") || "newest",
  });

  // 同步瀏覽器 back/forward：URL 從外部變化時更新 local state
  useEffect(() => {
    setLocalFilters({
      categories: searchParams.get("categories")?.split(",").filter(Boolean) || [],
      brands: searchParams.get("brands")?.split(",").filter(Boolean) || [],
      sortBy: searchParams.get("sortBy") || "newest",
    });
  }, [searchParams]);

  // 獲取無限滾動的產品數據（用 localFilters，點擊後立即 fetch）
  const {
    products,
    totalCount,
    availableFilters,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    isFetching,
  } = useInfiniteFilteredProductsByCollection({
    collectionId,
    categorySlug,
    categories: localFilters.categories,
    brands: localFilters.brands,
    sortBy: localFilters.sortBy,
    limit: 8,
    initialData,
  });

  // 設置無限滾動
  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

  // 更新過濾器：立即更新 local state，背景同步 URL
  const updateFilter = (
    type: "categories" | "brands",
    value: string,
    checked: boolean,
  ) => {
    const current = localFilters[type];
    const updated = checked
      ? [...current, value]
      : current.filter((v) => v !== value);
    const newFilters = { ...localFilters, [type]: updated };
    setLocalFilters(newFilters);
    const query = buildUrlFromFilters(newFilters);
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  // 更新排序
  const updateSort = (sortBy: string) => {
    const newFilters = { ...localFilters, sortBy };
    setLocalFilters(newFilters);
    const query = buildUrlFromFilters(newFilters);
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  // 清除所有過濾器（保留排序）
  const clearFilters = () => {
    const newFilters = { categories: [], brands: [], sortBy: localFilters.sortBy };
    setLocalFilters(newFilters);
    const query = buildUrlFromFilters(newFilters);
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-neutral-500">載入失敗，請重試</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-col justify-between md:flex-row md:items-center">
        {/* 頁面標題 */}
        <PageHeader
          categorySlug={categorySlug}
          totalCount={totalCount}
          isPending={isFetching}
          activeFilters={{
            categories: localFilters.categories,
            brands: localFilters.brands,
          }}
        />
        {/* 上方工具欄 */}
        <Toolbar
          sortBy={localFilters.sortBy}
          onSortChange={updateSort}
          onShowMobileFilters={() => setShowMobileFilters(true)}
        />
      </div>

      <div className="flex gap-8">
        {/* 左側過濾欄 - 桌面版 */}
        <DesktopFilters
          filterParams={localFilters}
          availableFilters={availableFilters}
          onClearFilters={clearFilters}
          onFilterChange={updateFilter}
          isPending={isFetching}
        />

        {/* 右側商品區域 */}
        <div className="flex-1">
          {/* 商品內容 */}
          <ProductGrid
            products={products}
            isPending={isFetching}
            collectionId={collectionId}
            categorySlug={categorySlug}
          />

          {/* 無限滾動觸發器 */}
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2">
                <Spinner />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 移動端過濾器彈窗 */}
      <MobileFilters
        showMobileFilters={showMobileFilters}
        filterParams={localFilters}
        availableFilters={availableFilters}
        onClose={() => setShowMobileFilters(false)}
        onClearFilters={clearFilters}
        onFilterChange={updateFilter}
        onSortChange={updateSort}
        isPending={isFetching}
      />
    </>
  );
};

export default CategoryProductsContent;
```

- [ ] **Step 3: 確認 TypeScript 不報錯**

```bash
pnpm tsc --noEmit
```

Expected: 無新增錯誤。

> **注意：** `DesktopFilters` 和 `MobileFilters` 的 `filterParams` prop 型別需要接受 `{ categories: string[]; brands: string[]; sortBy: string }`。若有型別錯誤，檢查這兩個元件的 prop 型別定義，確認它們沒有要求 `categorySlug` 或 `limit` 等額外欄位。

- [ ] **Step 4: 手動驗證**

啟動 dev server：
```bash
pnpm dev
```

1. 開啟任意分類頁（`/collections/...`）
2. 點擊左側 brand 或 category checkbox
3. **確認：點下去後 skeleton 幾乎立即出現**（不再有「點了沒反應」的等待）
4. 確認 URL address bar 正確更新（含 `?brands=X` 等參數）
5. 確認瀏覽器上一頁/下一頁後，filter 狀態正確還原
6. 確認 clearFilters（清除全部）後 URL 和 filter UI 都正確重置

- [ ] **Step 5: Commit**

```bash
git add src/modules/category-products/ui/view/category-products-content.tsx
git commit -m "perf: decouple filter state from searchParams to eliminate RSC round-trip delay"
```
