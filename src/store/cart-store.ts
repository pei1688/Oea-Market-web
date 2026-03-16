import { ProductVariant } from "@prisma/client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// 購物車商品類型
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selectedVariants: Record<string, string>; // 選中的變體ID映射
  variantText: string; // 變體顯示文字，如 "顏色: 紅色, 尺寸: L"
  stock: number;
  variantId?: string;
  spec2Id?: string;
}

// 購物車狀態類型
interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  // 新增：結帳商品狀態
  checkoutItems: CartItem[];
  checkoutTotalItems: number;
  checkoutTotalPrice: number;
}

// 購物車動作類型
interface CartActions {
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartItemByProductAndVariants: (
    productId: string,
    selectedVariants: Record<string, string>,
  ) => CartItem | undefined;
  // 新增：根據變體ID查找購物車項目
  getCartItemByVariantIds: (
    productId: string,
    variantId?: string,
    spec2Id?: string,
  ) => CartItem | undefined;
  isMaxStock: (item: any) => boolean;

  // 新增的 actions
  setCheckoutItems: (items: CartItem[]) => void;
  clearCheckoutItems: () => void;
  updateCheckoutItemQuantity: (itemId: string, quantity: number) => void;
}

// 計算總數量和總價格的輔助函數
const calculateTotals = (items: CartItem[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  return { totalItems, totalPrice };
};

// 創建購物車 store
export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      // 初始狀態
      items: [],
      totalItems: 0,
      totalPrice: 0,
      // 新增狀態
      checkoutItems: [],
      checkoutTotalItems: 0,
      checkoutTotalPrice: 0,

      // 添加商品到購物車
      addItem: (newItem) => {
        const currentItems = get().items;

        // 檢查是否已存在相同商品和變體的組合，優先使用變體ID進行比較，如果沒有則使用原有的方式
        const existingItemIndex = currentItems.findIndex((item) => {
          if (newItem.variantId && newItem.spec2Id) {
            // 如果有spec2，同時比較variantId和spec2Id
            return (
              item.productId === newItem.productId &&
              item.variantId === newItem.variantId &&
              item.spec2Id === newItem.spec2Id
            );
          } else if (newItem.variantId) {
            // 如果只有variantId，比較variantId
            return (
              item.productId === newItem.productId &&
              item.variantId === newItem.variantId &&
              !item.spec2Id
            );
          } else {
            // 如果沒有變體ID，使用原有的方式比較
            return (
              item.productId === newItem.productId &&
              JSON.stringify(item.selectedVariants) ===
                JSON.stringify(newItem.selectedVariants)
            );
          }
        });

        let updatedItems: CartItem[];
        if (existingItemIndex !== -1) {
          // 如果存在，增加數量
          updatedItems = currentItems.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item,
          );
        } else {
          // 如果不存在，添加新商品
          const cartItem: CartItem = {
            ...newItem,
            id: `${newItem.productId}_${Date.now()}_${Math.random()}`, // 生成唯一ID
          };
          updatedItems = [...currentItems, cartItem];
        }

        const { totalItems, totalPrice } = calculateTotals(updatedItems);

        set({
          items: updatedItems,
          totalItems,
          totalPrice,
        });
      },

      // 移除商品
      removeItem: (itemId) => {
        const updatedItems = get().items.filter((item) => item.id !== itemId);
        const { totalItems, totalPrice } = calculateTotals(updatedItems);

        set({
          items: updatedItems,
          totalItems,
          totalPrice,
        });
      },

      // 更新商品數量
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        const updatedItems = get().items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item,
        );

        const { totalItems, totalPrice } = calculateTotals(updatedItems);

        set({
          items: updatedItems,
          totalItems,
          totalPrice,
        });
      },

      // 清空購物車
      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalPrice: 0,
        });
      },

      // 根據商品ID和變體組合查找購物車中的商品
      getCartItemByProductAndVariants: (productId, selectedVariants) => {
        return get().items.find(
          (item) =>
            item.productId === productId &&
            JSON.stringify(item.selectedVariants) ===
              JSON.stringify(selectedVariants),
        );
      },

      // 新增：根據變體ID查找購物車項目
      getCartItemByVariantIds: (productId, variantId, spec2Id) => {
        return get().items.find((item) => {
          if (variantId && spec2Id) {
            return (
              item.productId === productId &&
              item.variantId === variantId &&
              item.spec2Id === spec2Id
            );
          } else if (variantId) {
            return (
              item.productId === productId &&
              item.variantId === variantId &&
              !item.spec2Id
            );
          } else {
            return item.productId === productId && !item.variantId;
          }
        });
      },

      // 檢查是否已達最大庫存
      isMaxStock: (item: any) => {
        return item.quantity >= item.stock;
      },

      setCheckoutItems: (items) =>
        set(() => {
          const checkoutTotalItems = items.reduce(
            (sum, item) => sum + item.quantity,
            0,
          );
          const checkoutTotalPrice = items.reduce(
            (sum, item) => sum + item.quantity * item.price,
            0,
          );

          return {
            checkoutItems: items,
            checkoutTotalItems,
            checkoutTotalPrice,
          };
        }),

      clearCheckoutItems: () =>
        set({
          checkoutItems: [],
          checkoutTotalItems: 0,
          checkoutTotalPrice: 0,
        }),

      updateCheckoutItemQuantity: (itemId, quantity) =>
        set((state) => {
          const newCheckoutItems = state.checkoutItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity: Math.min(Math.max(1, quantity), item.stock),
                }
              : item,
          );

          const checkoutTotalItems = newCheckoutItems.reduce(
            (sum, item) => sum + item.quantity,
            0,
          );
          const checkoutTotalPrice = newCheckoutItems.reduce(
            (sum, item) => sum + item.quantity * item.price,
            0,
          );

          // 同步更新主購物車中的數量
          const updatedMainItems = state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity: Math.min(Math.max(1, quantity), item.stock),
                }
              : item,
          );

          const totalItems = updatedMainItems.reduce(
            (sum, item) => sum + item.quantity,
            0,
          );
          const totalPrice = updatedMainItems.reduce(
            (sum, item) => sum + item.quantity * item.price,
            0,
          );

          return {
            checkoutItems: newCheckoutItems,
            checkoutTotalItems,
            checkoutTotalPrice,
            items: updatedMainItems,
            totalItems,
            totalPrice,
          };
        }),
    }),

    {
      name: "shopping-cart",
    },
  ),
);
