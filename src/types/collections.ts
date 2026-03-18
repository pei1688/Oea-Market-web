import { Collection } from "@prisma/client";

export interface ProductCollections {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    imgUrl: string[];
    brand: string | null;
    category: { name: string; slug?: string };
  };
}

export interface Category {
  id: string;
  name: string;
}

export interface CollectionProps {
  collections: Collection[];
}

export interface CollectionWithCategory {
  id: string;
  name: string;
  productCollections: {
    product: {
      category: Category;
    };
  }[];
}
