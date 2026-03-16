"use server";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { productInclude } from "@/lib/prisma-includes";
import { CACHE_TAGS } from "@/lib/cache-keys";

// ── getProducts ──────────────────────────────────────────────

const _getProducts = unstable_cache(
  async () => {
    return prisma.product.findMany({ include: productInclude });
  },
  ["products"],
  { tags: [CACHE_TAGS.products], revalidate: 300 }
);

export async function getProducts() {
  try {
    return await _getProducts();
  } catch (error) {
    console.log("商品獲取錯誤", error);
  }
}

// ── getRelatedProducts ───────────────────────────────────────
// 不快取：內部使用 Math.random()，快取會凍結隨機結果

export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 4,
) {
  const totalProducts = await prisma.product.count({
    where: {
      categoryId,
      NOT: { id: excludeProductId },
    },
  });

  const skip = Math.max(0, Math.floor(Math.random() * (totalProducts - limit)));

  const related = await prisma.product.findMany({
    where: {
      categoryId,
      NOT: { id: excludeProductId },
    },
    skip,
    take: limit,
    include: productInclude,
  });

  return related;
}

// ── getProduct ───────────────────────────────────────────────

const _getProduct = unstable_cache(
  async (productId: string) => {
    return prisma.product.findUnique({
      where: { id: productId },
      include: productInclude,
    });
  },
  ["product"],
  { tags: [CACHE_TAGS.products], revalidate: 300 }
);

export async function getProduct(productId: string) {
  try {
    return await _getProduct(productId);
  } catch (error) {
    console.log("商品獲取錯誤", error);
  }
}

// ── getProductsByCollectionId ────────────────────────────────

const _getProductsByCollectionId = unstable_cache(
  async (collectionId: string) => {
    return prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        productCollections: {
          include: {
            product: { include: productInclude },
          },
        },
      },
    });
  },
  ["products-by-collection"],
  { tags: [CACHE_TAGS.products], revalidate: 300 }
);

export async function getProductsByCollectionId(collectionId: string) {
  return _getProductsByCollectionId(collectionId);
}

// ── getProductIds ─────────────────────────────────────────────

const _getProductIds = unstable_cache(
  async () => {
    return prisma.product.findMany({ select: { id: true } });
  },
  ["product-ids"],
  { tags: [CACHE_TAGS.products], revalidate: 300 }
);

export async function getProductIds() {
  return _getProductIds();
}
