export interface DiscountInfo {
  hasDiscount: boolean;
  discountPercentage: number;
  originalPrice: number;
  discountedPrice: number;
}
//計算折扣價
export function calculateDiscountedPrice(
  price: number,
  isOnSale: boolean,
  discountPercentage?: number | null,
): DiscountInfo {
  const safeDiscount = discountPercentage ?? 0;

  const hasDiscount = !!(isOnSale && safeDiscount > 0);

  const discountedPrice = hasDiscount
    ? Math.round(price - price * (safeDiscount / 100))
    : price;

  return {
    hasDiscount,
    discountPercentage: safeDiscount,
    originalPrice: price,
    discountedPrice,
  };
}
