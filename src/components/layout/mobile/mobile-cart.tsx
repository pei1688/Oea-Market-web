"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart-store";
import { useState } from "react";

const MobileCart = () => {
  const [open, setOpen] = useState(false);
  const {
    items,
    totalItems,
    totalPrice,
    updateQuantity,
    removeItem,
    isMaxStock,
  } = useCartStore();

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }
    const item = items.find((cartItem) => cartItem.id === itemId);
    if (!item) return;
    if (newQuantity > item.stock) {
      toast.error(`已達最大庫存數量 (${item.stock} 件)`);
      return;
    }
    updateQuantity(itemId, newQuantity);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* trigger = 購物車 icon */}
      <SheetTrigger asChild>
        <Button
          className="relative bg-transparent px-3 py-1 shadow-transparent"
          size={"none"}
        >
          <ShoppingCart className="size-5 text-neutral-800" />
          {totalItems > 0 && (
            <span className="absolute -top-0 -right-0 flex size-4 items-center justify-center rounded-full bg-fuchsia-500 text-xs text-fuchsia-50">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>

      {/* drawer content */}
      <SheetContent side="top" className="h-full px-4 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>您的購物車 ({totalItems})</SheetTitle>
        </SheetHeader>

        <Separator className="bg-primary/20 my-4 w-full" />

        {items.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-neutral-500">尚未有商品</span>
          </div>
        ) : (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto rounded-lg border pr-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center space-x-3 p-3">
                <Link
                  href={`/product/${item.id.split("_")[0]}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3"
                >
                  <div className="relative size-16">
                    <Image
                      src={item.image}
                      alt={item.name}
                      className="rounded object-cover"
                      fill
                      priority
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-medium">{item.name}</h4>
                    {item.variantText && (
                      <p className="text-sm text-neutral-500">
                        {item.variantText}
                      </p>
                    )}
                    <p className="text-sm font-semibold">NT${item.price}</p>
                    {isMaxStock(item) && (
                      <p className="text-xs text-fuchsia-700">
                        已達最大庫存數量
                      </p>
                    )}
                  </div>
                </Link>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="none"
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity - 1)
                    }
                    className="size-8"
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="none"
                    onClick={() =>
                      handleQuantityChange(item.id, item.quantity + 1)
                    }
                    className="size-8"
                    disabled={isMaxStock(item)}
                  >
                    <Plus className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="none"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive size-8"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <>
            <Separator className="bg-primary/20 my-4 w-full" />
            <div className="space-y-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>總計：</span>
                <span>NT${totalPrice}</span>
              </div>
              <Button
                variant={"default"}
                size={"sm"}
                className="w-full rounded-sm text-sm"
                asChild
              >
                <Link href={"/cart"} onClick={() => setOpen(false)}>
                  查看購物車
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MobileCart;
