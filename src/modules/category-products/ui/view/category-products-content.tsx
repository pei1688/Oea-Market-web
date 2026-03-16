"use client";
import { useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useInfiniteFilteredProductsByCollection } from "@/services/products";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import PageHeader from "@/modules/category-products/components/page-header";
import Toolbar from "@/modules/category-products/components/toolbar";
import ProductGrid from "@/modules/category-products/components/product-grid";
import dynamic from "next/dynamic";
import {
  buildClearedFilters,
  buildUpdatedFilters,
  buildUpdatedSort,
} from "@/lib/filter";
import DesktopFilters from "../../components/desktop-filters";
import { Spinner } from "@/components/spinner";

const MobileFilters = dynamic(
  () => import("@/modules/category-products/components/mobile-filters"),
  { ssr: false },
);
interface CategoryProductsContentProps {
  collectionId: string;
  categorySlug?: string;
}

const CategoryProductsContent = ({
  collectionId,
  categorySlug,
}: CategoryProductsContentProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // 解析 URL 參數
  const filterParams = useMemo(() => {
    const categories =
      searchParams.get("categories")?.split(",").filter(Boolean) || [];
    const brands = searchParams.get("brands")?.split(",").filter(Boolean) || [];
    const sortBy = searchParams.get("sortBy") || "newest";

    return { categorySlug, categories, brands, sortBy, limit: 8 };
  }, [searchParams, categorySlug]);

  // 獲取無限滾動的產品數據
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
  });

  // 設置無限滾動
  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

  // 更新過濾器
  const updateFilter = (
    type: "categories" | "brands",
    value: string,
    checked: boolean,
  ) => {
    const query = buildUpdatedFilters(searchParams, type, value, checked);
    router.push(`${pathname}?${query}`);
  };

  // 更新排序
  const updateSort = (sortBy: string) => {
    const query = buildUpdatedSort(searchParams, sortBy);
    router.push(`${pathname}?${query}`);
  };

  // 清除所有過濾器
  const clearFilters = () => {
    const query = buildClearedFilters(filterParams);
    router.push(`${pathname}${query ? `?${query}` : ""}`);
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
          isPending={isLoading}
          activeFilters={{
            categories: filterParams.categories,
            brands: filterParams.brands,
          }}
        />
        {/* 上方工具欄 */}
        <Toolbar
          sortBy={filterParams.sortBy}
          onSortChange={updateSort}
          onShowMobileFilters={() => setShowMobileFilters(true)}
        />
      </div>

      <div className="flex gap-8">
        {/* 左側過濾欄 - 桌面版 */}
        <DesktopFilters
          filterParams={filterParams}
          availableFilters={availableFilters}
          onClearFilters={clearFilters}
          onFilterChange={updateFilter}
          isPending={isLoading}
        />

        {/* 右側商品區域 */}
        <div className="flex-1">
          {/* 商品內容 */}
          <ProductGrid products={products} isPending={isLoading} />

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
        filterParams={filterParams}
        availableFilters={availableFilters}
        onClose={() => setShowMobileFilters(false)}
        onClearFilters={clearFilters}
        onFilterChange={updateFilter}
        onSortChange={updateSort}
        isPending={isLoading}
      />
    </>
  );
};

export default CategoryProductsContent;
