"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { productListSelect } from "@/lib/prisma-includes";
import { getCategoryIdsByNames, getCollectionInfo } from "@/lib/cached-queries";
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

function getOrderBy(sortBy: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sortBy) {
    case "price-low":
      return [{ price: "asc" }, { id: "asc" }];
    case "price-high":
      return [{ price: "desc" }, { id: "desc" }];
    case "name-asc":
      return [{ name: "asc" }, { id: "asc" }];
    case "name-desc":
      return [{ name: "desc" }, { id: "desc" }];
    case "oldest":
      return [{ createdAt: "asc" }, { id: "asc" }];
    default:
      return [{ createdAt: "desc" }, { id: "desc" }];
  }
}

async function buildProductWhere({
  collectionId,
  categorySlug,
  categories,
  brands,
}: {
  collectionId: string;
  categorySlug?: string;
  categories: string[];
  brands: string[];
}): Promise<Prisma.ProductWhereInput> {
  const where: Prisma.ProductWhereInput = {
    productCollections: {
      some: { collectionId },
    },
  };

  if (categories.length > 0) {
    const categoryIds = await getCategoryIdsByNames(categories);
    where.categoryId = { in: categoryIds };
  } else if (categorySlug) {
    const categoryIds = await getCategoryIdsByNames([
      decodeURIComponent(categorySlug),
    ]);

    if (categoryIds.length > 0) {
      where.categoryId = { in: categoryIds };
    }
  }

  if (brands.length > 0) {
    where.brand = { in: brands };
  }

  return where;
}

const emptyFilters = { categories: [], brands: [] };

const _getInfiniteFirstPage = unstable_cache(
  async (
    collectionId: string,
    categorySlug: string | undefined,
    categories: string[],
    brands: string[],
    sortBy: string,
    limit: number,
  ): Promise<InfiniteFilteredProductsResult> => {
    const where = await buildProductWhere({
      collectionId,
      categorySlug,
      categories,
      brands,
    });

    const [collection, products] = await Promise.all([
      getCollectionInfo(collectionId),
      prisma.product.findMany({
        where,
        select: productListSelect,
        orderBy: getOrderBy(sortBy),
        take: limit + 1,
      }),
    ]);

    if (!collection) {
      throw new Error("Collection not found");
    }

    const hasNextPage = products.length > limit;
    const resultProducts = hasNextPage ? products.slice(0, -1) : products;

    return {
      products: resultProducts,
      nextCursor:
        hasNextPage && resultProducts.length > 0
          ? resultProducts[resultProducts.length - 1].id
          : null,
      hasNextPage,
      totalCount: 0,
      availableFilters: emptyFilters,
      collectionInfo: collection,
    };
  },
  ["infinite-filtered-products-first"],
  { tags: [CACHE_TAGS.products, CACHE_TAGS.collections], revalidate: 60 },
);

export async function getInfiniteFilteredProductsByCollection({
  collectionId,
  categorySlug,
  categories = [],
  brands = [],
  sortBy = "newest",
  cursor,
  limit = 12,
}: InfiniteProductFilterParams): Promise<InfiniteFilteredProductsResult> {
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

  const where = await buildProductWhere({
    collectionId,
    categorySlug,
    categories,
    brands,
  });

  const products = await prisma.product.findMany({
    where,
    select: productListSelect,
    orderBy: getOrderBy(sortBy),
    cursor: { id: cursor },
    skip: 1,
    take: limit + 1,
  });

  const hasNextPage = products.length > limit;
  const resultProducts = hasNextPage ? products.slice(0, -1) : products;

  return {
    products: resultProducts,
    nextCursor:
      hasNextPage && resultProducts.length > 0
        ? resultProducts[resultProducts.length - 1].id
        : null,
    hasNextPage,
    totalCount: 0,
    availableFilters: emptyFilters,
    collectionInfo: null,
  };
}
