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

export const useStockValidation = (
  productId: string,
  variantInfo: VariantInfo
) => {
  const { quantity } = useProductDetailStore();
  const { getCartItemByVariantIds } = useCartStore();

  const stockValidation = useMemo((): StockValidation => {
    const existingCartItem = getCartItemByVariantIds(
      productId,
      variantInfo.variantId,
      variantInfo.spec2Id,
    );

    const cartQuantity = existingCartItem ? existingCartItem.quantity : 0; // 目前購物車裡的數量
    const totalQuantity = cartQuantity + quantity; // 加上這次用戶準備加進購物車的數量
    const isExceeded = totalQuantity > variantInfo.stock; // 總數是否超出庫存
    
    return {
      isExceeded,
      cartQuantity,
      totalQuantity,
      availableQuantity: variantInfo.stock - cartQuantity, // 還能加幾個
      currentStock: variantInfo.stock,
    };
  }, [productId, variantInfo, quantity, getCartItemByVariantIds]);

  return stockValidation;
};