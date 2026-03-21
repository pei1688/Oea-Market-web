"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { productListSelect } from "@/lib/prisma-includes";
import { getCollectionInfo, getAvailableFilters } from "@/lib/cached-queries";
import { CACHE_TAGS } from "@/lib/cache-keys";

export interface InfiniteProductFilterParams {
  collectionId: string;
  categorySlug?: string;
  categories?: string[];
  brands?: string[];
  sortBy?: string;
  cursor?: string;
  limit?: number;
}

export interface InfiniteFilteredProductsResult {
  products: any[];
  nextCursor: string | null;
  hasNextPage: boolean;
  totalCount: number;
  availableFilters: {
    categories: string[];
    brands: string[];
  };
  collectionInfo: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

// ── 第一頁快取（無 cursor）────────────────────────────────────

const _getInfiniteFirstPage = unstable_cache(
  async (
    collectionId: string,
    categorySlug: string | undefined,
    categories: string[],
    brands: string[],
    sortBy: string,
    limit: number,
  ): Promise<InfiniteFilteredProductsResult> => {
    try {
      const baseWhere: Prisma.ProductWhereInput = {
        productCollections: {
          some: { collectionId },
        },
      };

      if (categorySlug) {
        const decoded = decodeURIComponent(categorySlug);
        if (decoded !== "全部") {
          baseWhere.category = { name: decoded };
        }
      }

      if (categories.length > 0) {
        baseWhere.category = { name: { in: categories } };
      }

      if (brands.length > 0) {
        baseWhere.brand = { in: brands };
      }

      // orderBy with id tiebreakers preserved for cursor-based pagination stability
      let orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
      switch (sortBy) {
        case "price-low":
          orderBy = [{ price: "asc" }, { id: "asc" }];
          break;
        case "price-high":
          orderBy = [{ price: "desc" }, { id: "desc" }];
          break;
        case "name-asc":
          orderBy = [{ name: "asc" }, { id: "asc" }];
          break;
        case "name-desc":
          orderBy = [{ name: "desc" }, { id: "desc" }];
          break;
        case "oldest":
          orderBy = [{ createdAt: "asc" }, { id: "asc" }];
          break;
        default:
          orderBy = [{ createdAt: "desc" }, { id: "desc" }];
          break;
      }

      const [collection, products, totalCount, filters] = await Promise.all([
        getCollectionInfo(collectionId),
        prisma.product.findMany({
          where: baseWhere,
          select: productListSelect,
          orderBy,
          take: limit + 1,
        }),
        prisma.product.count({ where: baseWhere }),
        getAvailableFilters(collectionId),
      ]);

      if (!collection) {
        throw new Error("Collection not found");
      }

      const hasNextPage = products.length > limit;
      const resultProducts = hasNextPage ? products.slice(0, -1) : products;
      const nextCursor =
        hasNextPage && resultProducts.length > 0
          ? resultProducts[resultProducts.length - 1].id
          : null;

      return {
        products: resultProducts,
        nextCursor,
        hasNextPage,
        totalCount,
        availableFilters: filters,
        collectionInfo: collection,
      };
    } catch (error) {
      console.error("獲取無限滾動產品錯誤:", error);
      throw error;
    }
  },
  ["infinite-filtered-products-first"],
  { tags: [CACHE_TAGS.products, CACHE_TAGS.collections], revalidate: 60 },
);

// ── 主要 action ───────────────────────────────────────────────

export async function getInfiniteFilteredProductsByCollection({
  collectionId,
  categorySlug,
  categories = [],
  brands = [],
  sortBy = "newest",
  cursor,
  limit = 12,
}: InfiniteProductFilterParams): Promise<InfiniteFilteredProductsResult> {
  // First page: use cache (all users share the same first page per filter combo)
  if (!cursor) {
    return _getInfiniteFirstPage(
      collectionId,
      categorySlug,
      categories,
      brands,
      sortBy,
      limit,
    );
  }

  // Cursor pages: direct DB query (cursor values are unique per user, cache hit rate ≈ 0)
  try {
    const baseWhere: Prisma.ProductWhereInput = {
      productCollections: {
        some: { collectionId },
      },
    };

    if (categorySlug) {
      const decoded = decodeURIComponent(categorySlug);
      if (decoded !== "全部") {
        baseWhere.category = { name: decoded };
      }
    }

    if (categories.length > 0) {
      baseWhere.category = { name: { in: categories } };
    }

    if (brands.length > 0) {
      baseWhere.brand = { in: brands };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
    switch (sortBy) {
      case "price-low":
        orderBy = [{ price: "asc" }, { id: "asc" }];
        break;
      case "price-high":
        orderBy = [{ price: "desc" }, { id: "desc" }];
        break;
      case "name-asc":
        orderBy = [{ name: "asc" }, { id: "asc" }];
        break;
      case "name-desc":
        orderBy = [{ name: "desc" }, { id: "desc" }];
        break;
      case "oldest":
        orderBy = [{ createdAt: "asc" }, { id: "asc" }];
        break;
      default:
        orderBy = [{ createdAt: "desc" }, { id: "desc" }];
        break;
    }

    const isAscending = ["price-low", "name-asc", "oldest"].includes(sortBy);
    baseWhere.id = isAscending ? { gt: cursor } : { lt: cursor };
    orderBy = orderBy.map((order) =>
      "id" in order ? { id: isAscending ? "asc" : "desc" } : order,
    );
    if (!orderBy.some((order) => "id" in order)) {
      orderBy.push({ id: isAscending ? "asc" : "desc" });
    }

    const [collection, products, totalCount, filters] = await Promise.all([
      getCollectionInfo(collectionId),
      prisma.product.findMany({
        where: baseWhere,
        select: productListSelect,
        orderBy,
        take: limit + 1,
      }),
      prisma.product.count({ where: baseWhere }),
      getAvailableFilters(collectionId),
    ]);

    if (!collection) {
      throw new Error("Collection not found");
    }

    const hasNextPage = products.length > limit;
    const resultProducts = hasNextPage ? products.slice(0, -1) : products;
    const nextCursor =
      hasNextPage && resultProducts.length > 0
        ? resultProducts[resultProducts.length - 1].id
        : null;

    return {
      products: resultProducts,
      nextCursor,
      hasNextPage,
      totalCount,
      availableFilters: filters,
      collectionInfo: collection,
    };
  } catch (error) {
    console.error("獲取無限滾動產品錯誤:", error);
    throw error;
  }
}
