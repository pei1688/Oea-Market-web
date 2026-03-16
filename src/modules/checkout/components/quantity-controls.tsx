"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface QuantityControlsProps {
  quantity: number;
  stock: number;
  onQuantityChange: (newQuantity: number) => void;
}

export const QuantityControls = ({
  quantity,
  stock,
  onQuantityChange,
}: QuantityControlsProps) => (
  <div className="flex items-center justify-center gap-4">
    <Button
      variant="ghost"
      size="none"
      onClick={() => onQuantityChange(quantity - 1)}
      className="size-6"
      disabled={quantity <= 1}
    >
      <Minus className="size-4" />
    </Button>
    <span className="w-8 text-center">{quantity}</span>
    <Button
      variant="ghost"
      size="none"
      onClick={() => onQuantityChange(quantity + 1)}
      className="size-6"
      disabled={quantity >= stock}
    >
      <Plus className="size-4" />
    </Button>
  </div>
);
