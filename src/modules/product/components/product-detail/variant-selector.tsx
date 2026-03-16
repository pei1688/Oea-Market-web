import { Button } from "@/components/ui/button";
import { useProductDetailStore } from "@/store/product-detail-store";
import { ProductDetailProps } from "@/types/product/product-detail";

interface VariantSelectorProps {
  groupedVariants: Record<string, any[]>;
  product: ProductDetailProps["product"];
  onVariantSelect: (specName: string, variant: any) => void;
  onSpec2Select: (variantId: string, spec2: any) => void;
}

export const VariantSelector = ({
  groupedVariants,
  product,
  onVariantSelect,
  onSpec2Select,
}: VariantSelectorProps) => {
  const { selectedVariants, selectedSpec2 } = useProductDetailStore();

  return (
    <div className="ae-des-content ae-body mt-10 space-y-4">
      {/* 規格1選擇 */}
      {Object.entries(groupedVariants).map(([specName, variants]) => (
        <div
          key={specName}
          className="flex flex-col gap-4 lg:flex-row lg:items-center"
        >
          <p>{specName}:</p>
          <div className="flex flex-wrap items-center gap-4">
            {variants.map((variant) => {
              const isSelected = selectedVariants[specName] === variant.id;
              return (
                <Button
                  key={variant.id}
                  variant="variantChoose"
                  onClick={() => onVariantSelect(specName, variant)}
                  className={`rounded-md border px-3 py-2 transition-colors ${
                    isSelected
                      ? "border-fuchsia-700"
                      : "border-neutral-300 hover:border-fuchsia-700"
                  }`}
                >
                  <p>{variant.spec1Value}</p>
                </Button>
              );
            })}
          </div>
        </div>
      ))}

      {/* 規格2選擇 */}
      {Object.entries(selectedVariants).map(([specName, variantId]) => {
        const variant = product.variants?.find((v) => v.id === variantId);
        if (!variant?.spec2Combinations?.length) return null;

        return (
          <div
            key={`spec2-${variantId}`}
            className="flex flex-col gap-4 lg:flex-row lg:items-center"
          >
            <p>{variant.spec2Combinations[0]?.spec2Name}:</p>
            <div className="flex flex-wrap items-center gap-4">
              {variant.spec2Combinations.map((spec2) => {
                const isSelected = selectedSpec2[variantId] === spec2.id;
                return (
                  <Button
                    key={spec2.id}
                    variant="variantChoose"
                    onClick={() => onSpec2Select(variantId, spec2)}
                    className={`rounded-md border px-3 py-2 transition-colors ${
                      isSelected
                        ? "border-fuchsia-700"
                        : "border-neutral-300 hover:border-fuchsia-700"
                    }`}
                  >
                    <p>{spec2.spec2Value}</p>
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
