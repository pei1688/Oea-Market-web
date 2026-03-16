import { useMemo } from "react";
import { ProductDetailProps } from "@/types/product/product-detail";
import { useProductDetailStore } from "@/store/product-detail-store";

export interface VariantInfo {
  stock: number;
  variantId: string | undefined;
  spec2Id: string | undefined;
  currentVariant: any | null;
  currentSpec2: any | null;
}

export const useVariantStock = (
  product: ProductDetailProps["product"],
  groupedVariants: Record<string, any[]>
) => {
  const { selectedVariants, selectedSpec2 } = useProductDetailStore();

  const isAllVariantsSelected = useMemo(() => {
    const allSpec1Selected = Object.keys(groupedVariants).every(
      (specName) => selectedVariants[specName],
    );

    if (!allSpec1Selected) return false;

    const selectedVariantIds = Object.values(selectedVariants);
    for (const variantId of selectedVariantIds) {
      const variant = product.variants?.find((v) => v.id === variantId);
      if (
        variant &&
        variant.spec2Combinations &&
        variant.spec2Combinations.length > 0
      ) {
        if (!selectedSpec2[variantId]) {
          return false;
        }
      }
    }

    return true;
  }, [selectedVariants, selectedSpec2, groupedVariants, product.variants]);

  const variantInfo = useMemo((): VariantInfo => {
    // 如果沒有變體，返回基礎產品庫存
    if (Object.keys(groupedVariants).length === 0) {
      return {
        stock: product.stock || 0,
        variantId: undefined,
        spec2Id: undefined,
        currentVariant: null,
        currentSpec2: null,
      };
    }

    // 如果沒有選擇所有必要的變體
    if (!isAllVariantsSelected) {
      return {
        stock: 0,
        variantId: undefined,
        spec2Id: undefined,
        currentVariant: null,
        currentSpec2: null,
      };
    }

    const selectedVariantIds = Object.values(selectedVariants);
    const currentVariant = product.variants?.find((variant) =>
      selectedVariantIds.includes(variant.id),
    );

    if (!currentVariant) {
      return {
        stock: 0,
        variantId: undefined,
        spec2Id: undefined,
        currentVariant: null,
        currentSpec2: null,
      };
    }

    const selectedSpec2Id = selectedSpec2[currentVariant.id];
    let currentSpec2 = null;
    let finalStock = currentVariant.stock || 0;

    // 如果有選擇 spec2，使用 spec2 的庫存
    if (selectedSpec2Id && currentVariant.spec2Combinations) {
      currentSpec2 = currentVariant.spec2Combinations.find(
        (spec2) => spec2.id === selectedSpec2Id,
      );
      if (currentSpec2) {
        finalStock = currentSpec2.stock || 0;
      }
    }

    return {
      stock: finalStock,
      variantId: currentVariant.id,
      spec2Id: selectedSpec2Id || undefined,
      currentVariant,
      currentSpec2,
    };
  }, [
    selectedVariants,
    selectedSpec2,
    groupedVariants,
    product,
    isAllVariantsSelected,
  ]);

  return {
    variantInfo,
    isAllVariantsSelected,
  };
};