import { useCallback } from "react";
import { useCartStore, matchCartItem } from "@/store/cart-store";
import { useProductDetailStore } from "@/store/product-detail-store";
import { VariantInfo } from "./use-variant-stock";

export interface StockValidation {
  isExceeded: boolean;
  isAtStockLimit: boolean;
  cartQuantity: number;
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
): StockValidation => {
  const { quantity: storeQuantity } = useProductDetailStore();
  const quantity = overrides?.quantity ?? storeQuantity;

  const cartItem = useCartStore(
    useCallback(
      (state) =>
        state.items.find((item) =>
          matchCartItem(item, productId, variantInfo.variantId, variantInfo.spec2Id)
        ),
      [productId, variantInfo.variantId, variantInfo.spec2Id]
    )
  );

  const cartQuantity = cartItem ? cartItem.quantity : 0;
  const currentStock = variantInfo.stock;
  const totalQuantity = cartQuantity + quantity;
  const isExceeded = totalQuantity > currentStock;
  const isAtStockLimit = currentStock > 0 && cartQuantity >= currentStock;

  return {
    isExceeded,
    isAtStockLimit,
    cartQuantity,
    availableQuantity: currentStock - cartQuantity,
    currentStock,
  };
};
