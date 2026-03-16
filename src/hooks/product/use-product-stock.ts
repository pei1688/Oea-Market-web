import { ProductDetailProps } from "@/types/product/product-detail";
import { useVariantStock } from "./use-variant-stock";
import { useStockValidation } from "./use-stock-validation";
import { useProductPrice } from "./use-product-price";

/**
 * 組合 hook - 整合變體庫存、庫存驗證和價格計算
 * 保持向後兼容性，同時提供分離的功能模塊
 */
export const useProductStock = (
  product: ProductDetailProps["product"],
  groupedVariants: Record<string, any[]>,
) => {
  // 使用分離的 hooks
  const { variantInfo, isAllVariantsSelected } = useVariantStock(
    product,
    groupedVariants,
  );
  const stockValidation = useStockValidation(product.id, variantInfo);
  const priceInfo = useProductPrice(product, variantInfo);

  return {
    variantInfo,
    stockValidation,
    isAllVariantsSelected,
    finalPrice: priceInfo.finalPrice,
    priceInfo,
  };
};

// 重新導出分離的 hooks 以便直接使用
export { useVariantStock } from "./use-variant-stock";
export { useStockValidation } from "./use-stock-validation";
export { useProductPrice } from "./use-product-price";
export type { VariantInfo } from "./use-variant-stock";
export type { StockValidation } from "./use-stock-validation";
export type { ProductPriceInfo } from "./use-product-price";
