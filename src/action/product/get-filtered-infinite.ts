"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { productInclude } from "@/lib/prisma-includes";
import { getCollectionInfo, getAvailableFilters } from "@/lib/cached-queries";

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

    if (cursor) {
      baseWhere.id = { lt: cursor };
      orderBy = orderBy.map((order) =>
        "id" in order ? { id: "desc" } : order,
      );
      if (!orderBy.some((order) => "id" in order)) {
        orderBy.push({ id: "desc" });
      }
    }

    const [collection, products, totalCount, filters] = await Promise.all([
      getCollectionInfo(collectionId),
      prisma.product.findMany({
        where: baseWhere,
        include: productInclude,
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
