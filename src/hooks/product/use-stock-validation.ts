import { useMemo } from "react";
import { useCartStore } from "@/store/cart-store";
import { useProductDetailStore } from "@/store/product-detail-store";
import { VariantInfo } from "./use-variant-stock";

export interface StockValidation {
  isExceeded: boolean;
  cartQuantity: number;
  totalQuantity: number;
  availableQuantity: number;
  currentStock: number;
}

interface StockValidationOverrides {
  quantity?: number;
}

export const useStockValidation = (
  productId: string,
  variantInfo: VariantInfo,
  overrides?: StockValidationOverrides,
) => {
  const { quantity: storeQuantity } = useProductDetailStore();
  const { getCartItemByVariantIds } = useCartStore();
  const quantity = overrides?.quantity ?? storeQuantity;

  const stockValidation = useMemo((): StockValidation => {
    const existingCartItem = getCartItemByVariantIds(
      productId,
      variantInfo.variantId,
      variantInfo.spec2Id,
    );

    const cartQuantity = existingCartItem ? existingCartItem.quantity : 0;
    const totalQuantity = cartQuantity + quantity;
    const isExceeded = totalQuantity > variantInfo.stock;

    return {
      isExceeded,
      cartQuantity,
      totalQuantity,
      availableQuantity: variantInfo.stock - cartQuantity,
      currentStock: variantInfo.stock,
    };
  }, [productId, variantInfo, quantity, getCartItemByVariantIds]);

  return stockValidation;
};
