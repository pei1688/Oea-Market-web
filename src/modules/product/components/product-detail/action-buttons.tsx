import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ActionButtonsProps {
  isDisabled: boolean;
  isAtStockLimit: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  isAdded: boolean;
}

export const ActionButtons = ({
  isDisabled,
  isAtStockLimit,
  onAddToCart,
  onBuyNow,
  isAdded,
}: ActionButtonsProps) => {
  return (
    <div className="flex flex-col gap-4">
      {isDisabled ? (
        <Button variant="default" className="w-full" asChild>
          <Link href={"/cart"}>立即購買</Link>
        </Button>
      ) : (
        <Button
          variant="default"
          className="w-full"
          onClick={onBuyNow}
          disabled={isDisabled}
        >
          立即購買
        </Button>
      )}

      <Button
        onClick={onAddToCart}
        disabled={isDisabled || isAdded}
        variant={"default2"}
        className="flex-1 text-fuchsia-800 transition-all duration-300 disabled:opacity-90"
      >
        {isAtStockLimit ? (
          <>庫存已達上限</>
        ) : isAdded ? (
          <>
            <svg
              width="24px"
              height="24px"
              strokeWidth="1"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              color="currentColor"
              className="text-green-700"
            >
              <path
                d="M5 13L9 17L19 7"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isAdded ? "check-path" : ""}
              ></path>
            </svg>
            已加入
          </>
        ) : (
          <>加入購物車</>
        )}
      </Button>
    </div>
  );
};
