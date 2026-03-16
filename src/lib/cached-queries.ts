// src/lib/cached-queries.ts
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-keys";

export const getCollectionInfo = unstable_cache(
  async (collectionId: string) => {
    return prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true, name: true, slug: true },
    });
  },
  ["collection-info"],
  { tags: [CACHE_TAGS.collections], revalidate: 600 }
);

export const getAvailableFilters = unstable_cache(
  async (collectionId: string) => {
    const allProducts = await prisma.product.findMany({
      where: {
        productCollections: {
          some: { collectionId },
        },
      },
      select: {
        category: { select: { name: true } },
        brand: true,
      },
    });

    const categories = Array.from(
      new Set(allProducts.map((p) => p.category.name))
    );
    const brands = Array.from(
      new Set(
        allProducts
          .map((p) => p.brand)
          .filter((b): b is string => Boolean(b))
      )
    );

    return { categories, brands };
  },
  ["available-filters"],
  { tags: [CACHE_TAGS.collections], revalidate: 600 }
);
