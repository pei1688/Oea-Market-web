import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SelectedItemsData {
  items: any[];
  totalItems: number;
  totalPrice: number;
}

interface CartInfoProps {
  selectedCount: number;
  selectedItemsData: SelectedItemsData;
  user: any;
  onCheckout: () => void;
}

export const CartInfo = ({
  selectedCount,
  selectedItemsData,
  user,
  onCheckout,
}: CartInfoProps) => {
  return (
    <div className="ae-cart-total mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">
          已選擇 {selectedCount} 件商品
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="text-center sm:text-left">
          小計({selectedItemsData.totalItems}件商品): TW$
          {selectedItemsData.totalPrice.toLocaleString()}
        </span>

        {user ? (
          <Button
            className="w-full sm:w-[200px]"
            disabled={selectedCount === 0}
            onClick={onCheckout}
          >
            前往結帳
          </Button>
        ) : (
          <Button className="w-full sm:w-[200px]" asChild>
            <Link href="/sign-in">請先登入</Link>
          </Button>
        )}
      </div>
    </div>
  );
};
