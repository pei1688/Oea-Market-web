"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

interface ProductCounterProps {
  stock: number;
  quantity: number;
  setQuantity: (quantity: number) => void;
}

const ProductCounter = ({
  stock,
  quantity,
  setQuantity,
}: ProductCounterProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleCounterChange = (value: number) => {
    if (value > stock) {
      setError(`選擇數量超過庫存（最多 ${stock} 件）`);
      setQuantity(stock);
    } else if (value < 1) {
      setError(null);
      setQuantity(1);
    } else {
      setError(null);
      setQuantity(value);
    }
  };

  const handleInc = () => {
    if (quantity < stock) {
      setQuantity(quantity + 1);
      setError(null);
    } else {
      setError(`選擇數量超過庫存（最多 ${stock} 件）`);
    }
  };

  const handleDec = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
      setError(null);
    }
  };

  return (
    <div className="ae-des-content my-8 flex w-full flex-col gap-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <p>數量:</p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex w-full items-center justify-between rounded-md border border-neutral-700/20 px-2 py-1">
            <Button
              variant={"ghost"}
              className="rounded-full transition-all hover:bg-fuchsia-500/10"
              onClick={handleDec}
              disabled={quantity <= 1}
            >
              <Minus className="size-4" />
            </Button>
            <Input
              type="text"
              className="w-12 border-none bg-transparent text-center outline-none"
              value={quantity}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value)) {
                  handleCounterChange(Number(value) || 1);
                }
              }}
              onBlur={() => {
                if (quantity < 1 || isNaN(quantity)) setQuantity(1);
              }}
            />
            <Button
              variant={"ghost"}
              className="rounded-full transition-all hover:bg-fuchsia-500/10"
              onClick={handleInc}
              disabled={quantity >= stock}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
};

export default ProductCounter;
