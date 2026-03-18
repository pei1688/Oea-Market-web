"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
    <DropdownMenu>
      {/* 使用 asChild 確保 Trigger 是 Button，並解決 ARIA 錯誤 */}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-9">
          <ShoppingCart className="size-6 transition-colors hover:text-neutral-600" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-fuchsia-500 text-[10px] font-bold text-white">
              {totalItems}
            </span>
          )}
          <span className="sr-only">開啟購物車預覽</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[320px] p-4 sm:w-95">
        <DropdownMenuLabel className="flex items-center justify-between text-base">
          <span>您的購物車 ({totalItems})</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-3" />

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-neutral-500">
            <ShoppingCart className="mb-2 size-10 opacity-20" />
            <span className="text-sm">尚未有商品</span>
          </div>
        ) : (
          <>
            <div className="max-h-87.5 space-y-4 overflow-y-auto pr-1">
              {items.map((item: any) => (
                <div key={item.id} className="flex gap-3">
                  {/* 商品圖片 */}
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-md border">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* 商品資訊 */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <h4 className="truncate text-sm font-medium">
                        {item.name}
                      </h4>
                      {item.variantText && (
                        <p className="text-xs text-neutral-500">
                          {item.variantText}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-bold">NT${item.price}</p>
                  </div>

                  {/* 數量操作 */}
                  <div className="flex flex-col items-end justify-between">
                    <Button
                      variant="ghost"
                      size="none"
                      onClick={() => removeItem(item.id)}
                      className="hover:text-destructive size-7 text-neutral-400"
                    >
                      <Trash2 className="size-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="none"
                        className="size-6 rounded-sm"
                        onClick={(e) => {
                          e.preventDefault(); // 防止觸發 Dropdown 關閉
                          handleQuantityChange(item.id, item.quantity - 1);
                        }}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-4 text-center text-xs">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="none"
                        className="size-6 rounded-sm"
                        disabled={isMaxStock(item)}
                        onClick={(e) => {
                          e.preventDefault();
                          handleQuantityChange(item.id, item.quantity + 1);
                        }}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <DropdownMenuSeparator className="my-4" />

            <div className="space-y-4">
              <div className="flex items-center justify-between text-base font-bold">
                <span>總計：</span>
                <span className="text-fuchsia-600">NT${totalPrice}</span>
              </div>
              <Button asChild className="w-full">
                <Link href="/cart">結帳帳單</Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NavbarCart;
