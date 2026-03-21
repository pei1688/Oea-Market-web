import { Prisma } from "@prisma/client";

export const productInclude = {
  category: true,
  variants: {
    include: {
      spec2Combinations: true,
    },
  },
  productCollections: {
    take: 1,
    include: {
      collection: {
        select: { id: true, name: true },
      },
    },
  },
} as const satisfies Prisma.ProductInclude;

// List view 專用：只 select ProductItem 實際需要的欄位
export const productListSelect = {
  id: true,
  name: true,
  price: true,
  imgUrl: true,
  isOnSale: true,
  discountPercentage: true,
  category: {
    select: { id: true, name: true },
  },
} as const satisfies Prisma.ProductSelect;
