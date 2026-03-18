import { Prisma } from "@prisma/client";

export const productInclude = {
  discountPercentage: true,
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
} as unknown as Prisma.ProductInclude;
