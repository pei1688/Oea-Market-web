import { CartItem } from "@/store/cart-store";
import { useState, useMemo } from "react";



export const useCartSelection = (items: CartItem[]) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleItemSelect = (itemId: string, checked: boolean) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const removeFromSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  const selectedItemsData = useMemo(() => {
    const selected = items.filter((item) => selectedItems.has(item.id));
    const totalSelectedItems = selected.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const totalSelectedPrice = selected.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    return {
      items: selected,
      totalItems: totalSelectedItems,
      totalPrice: totalSelectedPrice,
    };
  }, [items, selectedItems]);

  return {
    selectedItems,
    selectedItemsData,
    handleItemSelect,
    handleSelectAll,
    removeFromSelection,
  };
};
