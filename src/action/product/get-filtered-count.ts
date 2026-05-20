"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { CACHE_TAGS } from "@/lib/cache-keys";

export interface ProductCountFilterParams {
  collectionId: string;
  categorySlug?: string;
  categories?: string[];
  brands?: string[];
}

function buildProductWhere({
  collectionId,
  categorySlug,
  categories = [],
  brands = [],
}: ProductCountFilterParams): Prisma.ProductWhereInput {
  const baseWhere: Prisma.ProductWhereInput = {
    productCollections: {
      some: { collectionId },
    },
  };

  if (categorySlug) {
    const decoded = decodeURIComponent(categorySlug);
    if (decoded !== "?券") {
      baseWhere.category = { name: decoded };
    }
  }

  if (categories.length > 0) {
    baseWhere.category = { name: { in: categories } };
  }

  if (brands.length > 0) {
    baseWhere.brand = { in: brands };
  }

  return baseWhere;
}

const _getFilteredProductsCount = unstable_cache(
  async (
    collectionId: string,
    categorySlug: string | undefined,
    categories: string[],
    brands: string[],
  ) => {
    return prisma.product.count({
      where: buildProductWhere({
        collectionId,
        categorySlug,
        categories,
        brands,
      }),
    });
  },
  ["filtered-products-count"],
  { tags: [CACHE_TAGS.products, CACHE_TAGS.collections], revalidate: 60 },
);

export async function getFilteredProductsCount({
  collectionId,
  categorySlug,
  categories = [],
  brands = [],
}: ProductCountFilterParams): Promise<number> {
  return _getFilteredProductsCount(
    collectionId,
    categorySlug,
    categories,
    brands,
  );
}
