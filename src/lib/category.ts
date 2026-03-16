import { Category, CollectionWithCategory } from "@/types/collections";

/**
 * 從指定集合名稱中取得不重複的商品分類
 * @param collections 所有集合資料
 * @param collectionName 要查詢的集合名稱
 * @returns 不重複的分類陣列
 */
export function getCategoriesFromCollection(
  collections: CollectionWithCategory[],
  collectionName: string,
): Category[] {
  const collection = collections.find((col) => col.name === collectionName);
  if (!collection) return [];

  const categories = collection.productCollections.map(
    (pc) => pc.product.category,
  );

  const uniqueCategories = categories.filter(
    (category, index, self) =>
      index === self.findIndex((c) => c.id === category.id),
  );

  return uniqueCategories;
}
