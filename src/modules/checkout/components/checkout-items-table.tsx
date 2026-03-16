"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { QuantityControls } from "./quantity-controls";

interface CheckoutItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
  variantText?: string;
}

interface CheckoutItemsTableProps {
  items: CheckoutItem[];
  onQuantityChange: (itemId: string, newQuantity: number) => void;
}

export const CheckoutItemsTable = ({
  items,
  onQuantityChange,
}: CheckoutItemsTableProps) => (
  <div className="lg:col-span-2">
    <h2 className="ae-checkout-subTitle mb-4">訂單商品</h2>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">商品</TableHead>
          <TableHead>選項</TableHead>
          <TableHead>單價</TableHead>
          <TableHead className="w-[200px] text-center">數量</TableHead>
          <TableHead>小計</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="flex items-center space-x-3">
              <div className="relative h-16 w-16">
                <Image
                  src={item.image}
                  alt={item.name}
                  className="rounded object-cover"
                  fill
                  priority
                />
              </div>
              <h4 className="truncate font-medium">{item.name}</h4>
            </TableCell>
            <TableCell>
              {item.variantText && (
                <p className="text-sm text-neutral-500">{item.variantText}</p>
              )}
            </TableCell>
            <TableCell>${item.price}</TableCell>
            <TableCell>
              <QuantityControls
                quantity={item.quantity}
                stock={item.stock}
                onQuantityChange={(newQuantity) =>
                  onQuantityChange(item.id, newQuantity)
                }
              />
            </TableCell>
            <TableCell>${item.quantity * item.price}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
