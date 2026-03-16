"use client";
import { Button } from "@/components/ui/button";

interface ProductDialogActionsProps {
  onBuyNow: () => void;
  onAddToCart: () => void;
  disabled: boolean;
}

export const ProductDialogActions = ({
  onBuyNow,
  onAddToCart,
  disabled,
}: ProductDialogActionsProps) => {
  return (
    <div className="mt-6 flex flex-col gap-4 sm:col-start-2">
      <Button
        variant="default"
        className="w-full"
        onClick={onBuyNow}
        disabled={disabled}
      >
        立即購買
      </Button>
      <Button
        variant="default2"
        className="w-full bg-fuchsia-200/50 text-fuchsia-800"
        onClick={onAddToCart}
        disabled={disabled}
      >
        加入購物車
      </Button>
    </div>
  );
};
