import { getProduct } from "@/action/product";
import {
  Category,
  Collection,
  Prisma,
  Product,
  ProductVariant,
} from "@prisma/client";

// ProductWithCategory
export type ProductWithCategory = Product & {
  category: Category;
  variants?: ProductVariant[];
  collection?: Collection;
};

export type ProductListItem = {
  id: string;
  name: string;
  price: number;
  imgUrl: string[];
  isOnSale: boolean;
  discountPercentage?: number | null;
  category: {
    id: string;
    name: string;
  };
};

export interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
  variantText?: string;
}

export interface RelatedProductProps {
  categoryId: string;
  productId: string;
}

export type GetProducts = Prisma.PromiseReturnType<typeof getProduct>;
