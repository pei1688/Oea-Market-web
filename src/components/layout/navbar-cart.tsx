"use client";

import React from "react";
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import Image from "next/image";
import { Button } from "../ui/button";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";
import Link from "next/link";

const NavbarCart = () => {
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
    <NavigationMenuItem>
      <NavigationMenuTrigger className="relative">
        <Link href={"/cart"}>
          <ShoppingCart className="size-6 hover:text-neutral-600" />
        </Link>
        {totalItems > 0 && (
          <span className="absolute -top-0 -right-2 flex size-4 items-center justify-center rounded-full bg-fuchsia-500 text-xs text-fuchsia-50">
            {totalItems}
          </span>
        )}
      </NavigationMenuTrigger>

      <NavigationMenuContent className="bg-background2">
        <div className="p-4 md:w-[300px] lg:w-[400px]">
          <Label className="text-lg font-semibold">
            您的購物車 ({totalItems})
          </Label>
          <Separator className="bg-primary/20 my-4 w-full" />

          {items.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <span className="ae-des-subContent text-center">尚未有商品</span>
            </div>
          ) : (
            <div className="max-h-96 space-y-4 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 rounded-lg border p-3"
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
                    {/* 庫存狀態提示 */}
                    {isMaxStock(item) && (
                      <p
                        className={`text-xs text-fuchsia-700 transition-opacity duration-200 ${
                          isMaxStock(item)
                            ? "visible opacity-100"
                            : "invisible opacity-0"
                        }`}
                      >
                        已達最大庫存數量
                      </p>
                    )}
                  </div>
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
                  <Link href={"/cart"}>查看購物車</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};

export default NavbarCart;
