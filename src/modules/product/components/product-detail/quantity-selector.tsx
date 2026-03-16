import ProductCounter from "../product-counter";


interface QuantitySelectorProps {
  stock: number;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export const QuantitySelector = ({
  stock,
  quantity,
  onQuantityChange,
}: QuantitySelectorProps) => (
  <div className="mt-4 flex flex-col gap-2">
    <div className="flex items-center gap-4">
      <ProductCounter
        stock={stock}
        quantity={quantity}
        setQuantity={onQuantityChange}
      />
    </div>
    {stock > 0 && quantity >= stock && (
      <p className="text-destructive text-sm">已達最大庫存數量 ({stock} 件)</p>
    )}
  </div>
);
