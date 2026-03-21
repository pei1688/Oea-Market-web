"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { productListSelect } from "@/lib/prisma-includes";
import { getCollectionInfo, getAvailableFilters } from "@/lib/cached-queries";
import { CACHE_TAGS } from "@/lib/cache-keys";

// ── 型別定義 ──────────────────────────────────────────────────

export interface ProductFilterParams {
  collectionId: string;
  categorySlug?: string;
  categories?: string[];
  brands?: string[];
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface FilteredProductsResult {
  products: any[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
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

// ── 主要 action ───────────────────────────────────────────────

const _getFilteredProductsByCollection = unstable_cache(
  async (
    collectionId: string,
    categorySlug: string | undefined,
    categories: string[],
    brands: string[],
    sortBy: string,
    page: number,
    limit: number,
  ): Promise<FilteredProductsResult> => {
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
        case "price-low":   orderBy = [{ price: "asc" }]; break;
        case "price-high":  orderBy = [{ price: "desc" }]; break;
        case "name-asc":    orderBy = [{ name: "asc" }]; break;
        case "name-desc":   orderBy = [{ name: "desc" }]; break;
        case "oldest":      orderBy = [{ createdAt: "asc" }]; break;
        default:            orderBy = [{ createdAt: "desc" }]; break;
      }

      const skip = (page - 1) * limit;

      const [collection, products, totalCount, filters] = await Promise.all([
        getCollectionInfo(collectionId),
        prisma.product.findMany({
          where: baseWhere,
          select: productListSelect,
          orderBy,
          skip,
          take: limit,
        }),
        prisma.product.count({ where: baseWhere }),
        getAvailableFilters(collectionId),
      ]);

      if (!collection) {
        throw new Error("Collection not found");
      }

      const totalPages = Math.ceil(totalCount / limit);

      return {
        products,
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        availableFilters: filters,
        collectionInfo: collection,
      };
    } catch (error) {
      console.error("獲取過濾產品錯誤:", error);
      throw error;
    }
  },
  ["filtered-products"],
  { tags: [CACHE_TAGS.products, CACHE_TAGS.collections], revalidate: 60 },
);

export async function getFilteredProductsByCollection({
  collectionId,
  categorySlug,
  categories = [],
  brands = [],
  sortBy = "newest",
  page = 1,
  limit = 12,
}: ProductFilterParams): Promise<FilteredProductsResult> {
  return _getFilteredProductsByCollection(
    collectionId,
    categorySlug,
    categories,
    brands,
    sortBy,
    page,
    limit,
  );
}
