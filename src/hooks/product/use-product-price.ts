import { useMemo } from "react";
import { ProductDetailProps } from "@/types/product/product-detail";
import { VariantInfo } from "./use-variant-stock";
import { calculateDiscountedPrice } from "@/lib/price";

export interface ProductPriceInfo {
  basePrice: number;
  finalPrice: number;
  hasDiscount: boolean;
  discountPercentage: number;
  originalPrice: number;
  discountedPrice: number;
}

export const useProductPrice = (
  product: ProductDetailProps["product"],
  variantInfo: VariantInfo,
): ProductPriceInfo => {
  const priceInfo = useMemo((): ProductPriceInfo => {
    // 確定基礎價格（根據變體選擇）
    let basePrice = product.price;

    if (variantInfo.currentSpec2?.price) {
      basePrice = variantInfo.currentSpec2.price;
    } else if (variantInfo.currentVariant?.price) {
      basePrice = variantInfo.currentVariant.price;
    }
    const discountInfo = calculateDiscountedPrice(
      basePrice,
      product.isOnSale,
      product.discountPercentage,
    );

    return {
      basePrice,
      finalPrice: discountInfo.discountedPrice,
      hasDiscount: discountInfo.hasDiscount,
      discountPercentage: discountInfo.discountPercentage,
      originalPrice: discountInfo.originalPrice,
      discountedPrice: discountInfo.discountedPrice,
    };
  }, [
    product.price,
    product.isOnSale,
    product.discountPercentage,
    variantInfo.currentSpec2,
    variantInfo.currentVariant,
  ]);

  return priceInfo;
};
