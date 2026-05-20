"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useAvailableFiltersByCollection,
  useInfiniteFilteredProductsByCollection,
} from "@/services/products";
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

function buildUrlFromFilters(filters: {
  categories: string[];
  brands: string[];
  sortBy: string;
}): string {
  const params = new URLSearchParams();
  if (filters.categories.length > 0) {
    params.set("categories", filters.categories.join(","));
  }
  if (filters.brands.length > 0) {
    params.set("brands", filters.brands.join(","));
  }
  if (filters.sortBy !== "newest") {
    params.set("sortBy", filters.sortBy);
  }
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

  const [localFilters, setLocalFilters] = useState({
    categories:
      searchParams.get("categories")?.split(",").filter(Boolean) || [],
    brands: searchParams.get("brands")?.split(",").filter(Boolean) || [],
    sortBy: searchParams.get("sortBy") || "newest",
  });

  const [isFilterPending, startFilterTransition] = useTransition();

  useEffect(() => {
    setLocalFilters({
      categories:
        searchParams.get("categories")?.split(",").filter(Boolean) || [],
      brands: searchParams.get("brands")?.split(",").filter(Boolean) || [],
      sortBy: searchParams.get("sortBy") || "newest",
    });
  }, [searchParams]);

  const {
    products,
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

  const {
    availableFilters,
    isPending: isAvailableFiltersPending,
    isError: isAvailableFiltersError,
  } = useAvailableFiltersByCollection({
    collectionId,
    initialData: initialData?.availableFilters,
  });

  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

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

    setLocalFilters(newFilters);
    startFilterTransition(() => {
      router.replace(`${pathname}${query ? `?${query}` : ""}`, {
        scroll: false,
      });
    });
  };

  const updateSort = (sortBy: string) => {
    const newFilters = { ...localFilters, sortBy };
    const query = buildUrlFromFilters(newFilters);

    setLocalFilters(newFilters);
    startFilterTransition(() => {
      router.replace(`${pathname}${query ? `?${query}` : ""}`, {
        scroll: false,
      });
    });
  };

  const clearFilters = () => {
    const newFilters = {
      categories: [],
      brands: [],
      sortBy: localFilters.sortBy,
    };
    const query = buildUrlFromFilters(newFilters);

    setLocalFilters(newFilters);
    startFilterTransition(() => {
      router.replace(`${pathname}${query ? `?${query}` : ""}`, {
        scroll: false,
      });
    });
  };

  const isPending = isFilterPending || isFetching;

  if (isError || isAvailableFiltersError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-neutral-500">商品獲取錯誤，請稍後再次嘗試。</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-col justify-between md:flex-row md:items-center">
        <PageHeader
          categorySlug={categorySlug}
          isPending={isPending}
          activeFilters={{
            categories: localFilters.categories,
            brands: localFilters.brands,
          }}
        />
        <Toolbar
          sortBy={localFilters.sortBy}
          onSortChange={updateSort}
          onShowMobileFilters={() => setShowMobileFilters(true)}
        />
      </div>
      <div className="flex gap-8">
        <DesktopFilters
          filterParams={localFilters}
          availableFilters={availableFilters}
          onClearFilters={clearFilters}
          onFilterChange={updateFilter}
          isPending={isAvailableFiltersPending}
        />

        <div className="flex-1">
          <ProductGrid
            products={products}
            isPending={isPending && !isFetchingNextPage}
            collectionId={collectionId}
            categorySlug={categorySlug}
          />

          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2">
                <Spinner />
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileFilters
        showMobileFilters={showMobileFilters}
        filterParams={localFilters}
        availableFilters={availableFilters}
        onClose={() => setShowMobileFilters(false)}
        onClearFilters={clearFilters}
        onFilterChange={updateFilter}
        onSortChange={updateSort}
        isPending={isAvailableFiltersPending}
      />
    </>
  );
};

export default CategoryProductsContent;
