import { ProductWithCategory } from "./product";

// 擴展的變體類型，包含 spec2 關聯
interface ExtendedProductVariant {
  id: string;
  productId: string;
  spec1Name: string;
  spec1Value: string;
  spec1Image: string | null;
  price: number | null;
  stock: number | null;
  sku: string | null;
  spec2Combinations?: {
    id: string;
    spec2Name: string;
    spec2Value: string;
    price: number | null;
    stock: number | null;
    sku: string | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// 擴展的商品類型
interface ExtendedProductWithCategory
  extends Omit<ProductWithCategory, "variants"> {
  variants?: ExtendedProductVariant[];
  isOnSale: boolean;
  discountPercentage: number | null;
}

export interface ProductDetailProps {
  product: ExtendedProductWithCategory;
}