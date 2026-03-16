import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  isDisabled: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

export const ActionButtons = ({
  isDisabled,
  onAddToCart,
  onBuyNow,
}: ActionButtonsProps) => {


  return (
    <div className="flex-col gap-4 flex">
      {/* <Separator className="bg-primary/20 my-8" /> */}
      <Button
        variant="default"
        className="w-full"
        onClick={onBuyNow}
        disabled={isDisabled}
      >
        立即購買
      </Button>
      <Button
        variant="default2"
        className="w-full bg-fuchsia-200/50 text-fuchsia-800"
        onClick={onAddToCart}
        disabled={isDisabled}
      >
        加入購物車
      </Button>
    </div>
  );
};
