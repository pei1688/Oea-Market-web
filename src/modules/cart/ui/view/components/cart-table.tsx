"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type CartItem } from "@/store/cart-store";

type CartTableProps = {
  items: CartItem[];
  selectedItems: Set<string>;
  handleSelectAll: (checked: boolean) => void;
  handleItemSelect: (id: string, checked: boolean) => void;
  handleQuantityChange: (id: string, newQuantity: number) => void;
  removeItem: (id: string) => void;
};

const CartTable = ({
  items,
  selectedItems,
  handleSelectAll,
  handleItemSelect,
  handleQuantityChange,
  removeItem,
}: CartTableProps) => {
  // 檢查是否全選
  const isAllSelected = items.length > 0 && selectedItems.size === items.length;
  const isIndeterminate =
    selectedItems.size > 0 && selectedItems.size < items.length;

  // 數量控制組件
  const QuantityControls = ({ item }: { item: CartItem }) => (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      <Button
        variant="ghost"
        size="none"
        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
        className="size-6 sm:size-8"
      >
        <Minus className="size-3 sm:size-4" />
      </Button>
      <span className="w-8 text-center font-medium">{item.quantity}</span>
      <Button
        variant="ghost"
        size="none"
        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
        className="size-6 sm:size-8"
        disabled={item.quantity >= item.stock}
      >
        <Plus className="size-3 sm:size-4" />
      </Button>
    </div>
  );

  return (
    <>
      {/* 桌面端表格視圖 */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12.5">
                <Checkbox
                  checked={
                    isAllSelected
                      ? true
                      : isIndeterminate
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="全選商品"
                />
              </TableHead>
              <TableHead className="w-75">商品</TableHead>
              <TableHead>選項</TableHead>
              <TableHead>單價</TableHead>
              <TableHead className="w-50 text-center">數量</TableHead>
              <TableHead>總價格</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="">
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={(checked) =>
                      handleItemSelect(item.id, checked as boolean)
                    }
                    aria-label={`選擇 ${item.name}`}
                  />
                </TableCell>
                <TableCell className="rounded-lg">
                  <Link
                    href={item.collectionId ? `/collections/${item.collectionId}/全部/product/${item.productId}` : `/product/${item.productId}`}
                    className="flex items-center space-x-3"
                  >
                    <div className="relative h-16 w-16 shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        className="rounded object-cover"
                        fill
                        quality={60}
                      />
                    </div>
                    <h4 className="ae-card-title truncate">{item.name}</h4>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="min-w-0 flex-1">
                    {item.variantText && <p>{item.variantText}</p>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="w-8 text-center">
                    NT${item.price.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="w-37.5">
                  <QuantityControls item={item} />
                </TableCell>
                <TableCell>
                  NT${(item.quantity * item.price).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive/70 size-8 p-0"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* mobile*/}
      <div className="lg:hidden">
        {/* 全選控制 */}
        <div className="mb-4 flex items-center gap-3 rounded-sm bg-neutral-50 p-4 shadow-md">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={handleSelectAll}
            aria-label="全選商品"
            className={
              isIndeterminate ? "data-[state=checked]:bg-primary/50" : ""
            }
          />
          <span className="text-sm font-medium">
            全選 ({selectedItems.size}/{items.length})
          </span>
        </div>

        {/* 商品卡片列表 */}
        <div className="max-h-100 space-y-4 overflow-y-auto shadow-md md:max-h-125">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden rounded-sm">
              <CardContent className="p-4">
                {/* 選擇框和刪除按鈕 */}
                <div className="mb-3 flex items-center justify-between">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={(checked) =>
                      handleItemSelect(item.id, checked as boolean)
                    }
                    aria-label={`選擇 ${item.name}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive/70 size-8 p-0"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {/* 商品信息 */}
                <Link
                  href={item.collectionId ? `/collections/${item.collectionId}/全部/product/${item.productId}` : `/product/${item.productId}`}
                  className="mb-4 flex gap-3"
                >
                  <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
                    <Image
                      src={item.image}
                      alt={item.name}
                      className="rounded object-cover"
                      fill
                      priority
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="ae-card-title mb-1 line-clamp-2">
                      {item.name}
                    </h4>
                    {item.variantText && (
                      <p className="mb-2 text-sm text-neutral-500">
                        {item.variantText}
                      </p>
                    )}
                    <p className="text-primary text-lg font-semibold">
                      NT${item.price.toLocaleString()}
                    </p>
                  </div>
                </Link>

                {/* 數量控制和總價 */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-neutral-500">數量</span>
                    <QuantityControls item={item} />
                  </div>
                  <div className="text-right">
                    <p className="ae-caption mb-1">小計</p>
                    <p className="ae-body">
                      NT${(item.quantity * item.price).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 庫存提示 */}
                {item.quantity >= item.stock && (
                  <div className="mt-2 rounded bg-yellow-50 p-2">
                    <p className="ae-small text-fuchsia-700">
                      已達庫存上限 ({item.stock} 件)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default CartTable;
