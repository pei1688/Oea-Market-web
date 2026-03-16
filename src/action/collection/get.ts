"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-keys";

// ── getCollectionById ─────────────────────────────────────────

const _getCollectionById = unstable_cache(
  async (collectionId: string) => {
    return prisma.collection.findUnique({
      where: { id: collectionId },
      select: {
        id: true,
        name: true,
        productCollections: {
          select: {
            id: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imgUrl: true,
                isOnSale: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },
  ["collection-by-id"],
  { tags: [CACHE_TAGS.collections], revalidate: 600 }
);

export async function getCollectionById(collectionId: string) {
  try {
    return await _getCollectionById(collectionId);
  } catch (error) {
    console.log("合集獲取錯誤", error);
    return null;
  }
}

// ── getCollections ────────────────────────────────────────────

const _getCollections = unstable_cache(
  async () => {
    return prisma.collection.findMany({
      include: {
        productCollections: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imgUrl: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },
  ["collections"],
  { tags: [CACHE_TAGS.collections], revalidate: 600 }
);

export async function getCollections() {
  try {
    return await _getCollections();
  } catch (error) {
    console.log("合集獲取錯誤", error);
    return [];
  }
}

// ── getCollectionsWithCategory ────────────────────────────────

const _getCollectionsWithCategory = unstable_cache(
  async () => {
    return prisma.collection.findMany({
      include: {
        productCollections: {
          select: {
            product: {
              select: {
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },
  ["collections-with-category"],
  { tags: [CACHE_TAGS.collections], revalidate: 600 }
);

export async function getCollectionsWithCategory() {
  try {
    return await _getCollectionsWithCategory();
  } catch (error) {
    console.log("合集獲取錯誤", error);
    return [];
  }
}
