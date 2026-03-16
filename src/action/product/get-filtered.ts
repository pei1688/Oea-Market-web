"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { productInclude } from "@/lib/prisma-includes";
import { getCollectionInfo, getAvailableFilters } from "@/lib/cached-queries";

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

export async function getFilteredProductsByCollection({
  collectionId,
  categorySlug,
  categories = [],
  brands = [],
  sortBy = "newest",
  page = 1,
  limit = 12,
}: ProductFilterParams): Promise<FilteredProductsResult> {
  try {
    // 構建過濾條件
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

    // 排序
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

    // 四個查詢完全平行執行
    const [collection, products, totalCount, filters] = await Promise.all([
      getCollectionInfo(collectionId),
      prisma.product.findMany({
        where: baseWhere,
        include: productInclude,
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
}
