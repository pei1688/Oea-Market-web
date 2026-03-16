import { create } from "zustand";

interface ProductDetailState {
  currentImage: string;
  selectedVariants: Record<string, string>;
  selectedSpec2: Record<string, string>;
  quantity: number;
  currentProductId: string | null; 

  // Actions
  setCurrentImage: (image: string) => void;
  setSelectedVariants: (variants: Record<string, string>) => void;
  setSelectedSpec2: (spec2: Record<string, string>) => void;
  setQuantity: (quantity: number) => void;
  setCurrentProductId: (productId: string) => void; // 新增：設置當前商品ID
  resetState: (defaultImage: string) => void;
  initializeWithDefaults: (defaultImage: string, defaultVariants: Record<string, string>, defaultSpec2: Record<string, string>) => void;
}

export const useProductDetailStore = create<ProductDetailState>((set) => ({
  currentImage: "",
  selectedVariants: {},
  selectedSpec2: {},
  quantity: 1,
  currentProductId: null, // 初始化為null

  setCurrentImage: (image) => set({ currentImage: image }),
  setSelectedVariants: (variants) => set({ selectedVariants: variants }),
  setSelectedSpec2: (spec2) => set({ selectedSpec2: spec2 }),
  setQuantity: (quantity) => set({ quantity }),
  setCurrentProductId: (productId) => set({ currentProductId: productId }),
  resetState: (defaultImage) =>
    set({
      currentImage: defaultImage,
      selectedVariants: {},
      selectedSpec2: {},
      quantity: 1,
      currentProductId: null, // 重置時清除商品ID
    }),
  initializeWithDefaults: (defaultImage, defaultVariants, defaultSpec2) =>
    set({
      currentImage: defaultImage,
      selectedVariants: defaultVariants,
      selectedSpec2: defaultSpec2,
      quantity: 1,
    }),
}));
