"use client";
import { useState, useEffect, useTransition } from "react";
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

  const [isFilterPending, startFilterTransition] = useTransition();

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
    const query = buildUrlFromFilters(newFilters);
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    startFilterTransition(() => {
      setLocalFilters(newFilters);
    });
  };

  // 更新排序
  const updateSort = (sortBy: string) => {
    const newFilters = { ...localFilters, sortBy };
    const query = buildUrlFromFilters(newFilters);
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    startFilterTransition(() => {
      setLocalFilters(newFilters);
    });
  };

  // 清除所有過濾器（保留排序）
  const clearFilters = () => {
    const newFilters = { categories: [], brands: [], sortBy: localFilters.sortBy };
    const query = buildUrlFromFilters(newFilters);
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    startFilterTransition(() => {
      setLocalFilters(newFilters);
    });
  };

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-neutral-500">載入失敗，請重試</p>
      </div>
    );
  }

  const isPending = isFilterPending || isFetching;

  return (
    <>
      <div className="mb-8 flex flex-col justify-between md:flex-row md:items-center">
        {/* 頁面標題 */}
        <PageHeader
          categorySlug={categorySlug}
          totalCount={totalCount}
          isPending={isPending}
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
          isPending={isPending}
        />

        {/* 右側商品區域 */}
        <div className="flex-1">
          {/* 商品內容 */}
          <ProductGrid
            products={products}
            isPending={isPending && !isFetchingNextPage}
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
        isPending={isPending}
      />
    </>
  );
};

export default CategoryProductsContent;
