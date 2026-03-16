import { useMemo } from "react";
import { ProductDetailProps } from "@/types/product/product-detail";

export const useProductVariants = (product: ProductDetailProps["product"]) => {
  const groupedVariants = useMemo(() => {
    return (
      product.variants?.reduce(
        (acc, variant) => {
          const specName = variant.spec1Name;
          if (!acc[specName]) {
            acc[specName] = [];
          }
          acc[specName].push(variant);
          return acc;
        },
        {} as Record<string, typeof product.variants>,
      ) || {}
    );
  }, [product]);

  return { groupedVariants };
};
