import {
  getProduct,
  getProductsByCollectionId,
  getRelatedProducts,
  getFilteredProductsByCollection,
  getInfiniteFilteredProductsByCollection,
  type ProductFilterParams,
  type FilteredProductsResult,
  type InfiniteProductFilterParams,
  type InfiniteFilteredProductsResult,
} from "@/action/product";
import { GetProducts, RelatedProductProps } from "@/types/product/product";
import { Prisma } from "@prisma/client";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

export type GetProductsByCollectionIdResult = Prisma.PromiseReturnType<
  typeof getProductsByCollectionId
>;
type UseAllProductsOptions = {
  collectionId: string;
  initialData?: GetProductsByCollectionIdResult;
};
//🔸
export const useAllProductsByCollectionId = ({
  collectionId,
  initialData,
}: UseAllProductsOptions) => {
  const {
    data: allProducts,
    isError,
    isPending,
  } = useQuery<GetProductsByCollectionIdResult>({
    queryKey: ["allProducts", collectionId],
    queryFn: () => getProductsByCollectionId(collectionId),
    initialData,
    staleTime: 1000 * 60 * 60,
  });
  return { allProducts, isError, isPending };
};

//🔸

interface ProductByIdProps {
  id: string;
  initialData?: GetProducts;
}

export const useProductById = ({ id, initialData }: ProductByIdProps) => {
  const {
    data: product,
    error,
    isPending,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
    staleTime: 1000 * 60 * 60,
    enabled: !!id,
    initialData,
  });
  return { product, isPending, error };
};

//🔸
export const useRelatedProducts = ({
  categoryId,
  productId,
}: RelatedProductProps) => {
  const {
    data: products,
    error,
    isPending,
  } = useQuery({
    queryKey: ["relatedProducts", categoryId, productId],
    queryFn: () => getRelatedProducts(categoryId, productId),
  });

  return { products, isPending, error };
};

//🔸 使用後端過濾的產品查詢
interface UseFilteredProductsOptions extends Omit<
  ProductFilterParams,
  "collectionId"
> {
  collectionId: string;
  enabled?: boolean;
}

export const useFilteredProductsByCollection = ({
  collectionId,
  categorySlug,
  categories,
  brands,
  sortBy,
  page,
  limit,

  enabled = true,
}: UseFilteredProductsOptions) => {
  const { data, isError, isPending } = useQuery<FilteredProductsResult>({
    queryKey: [
      "filteredProducts",
      collectionId,
      categorySlug,
      categories,
      brands,
      sortBy,
      page,
      limit,
    ],

    queryFn: async () => {
      return await getFilteredProductsByCollection({
        collectionId,
        categorySlug,
        categories,
        brands,
        sortBy,
        page,
        limit,
      });
    },
    enabled: enabled && !!collectionId,
    staleTime: 1000 * 60 * 5, // 5分鐘緩存
    gcTime: 1000 * 60 * 10, // 10分鐘垃圾回收
    retry: 1,
  });

  return {
    data,
    isError,
    isPending,
  };
};

//🔸 無限滾動的產品查詢
interface UseInfiniteFilteredProductsOptions extends Omit<
  InfiniteProductFilterParams,
  "collectionId" | "cursor"
> {
  collectionId: string;
  enabled?: boolean;
  initialData?: InfiniteFilteredProductsResult;
}

export const useInfiniteFilteredProductsByCollection = ({
  collectionId,
  categorySlug,
  categories,
  brands,
  sortBy,
  limit = 8,
  enabled = true,
  initialData,
}: UseInfiniteFilteredProductsOptions) => {
  const query = useInfiniteQuery({
    queryKey: [
      "infiniteFilteredProducts",
      collectionId,
      categorySlug,
      categories,
      brands,
      sortBy,
      limit,
    ],
    queryFn: ({ pageParam }) =>
      getInfiniteFilteredProductsByCollection({
        collectionId,
        categorySlug,
        categories,
        brands,
        sortBy,
        cursor: pageParam,
        limit,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: enabled && !!collectionId,
    staleTime: 1000 * 60 * 5, // 5 分鐘快取
    gcTime: 1000 * 60 * 10, // 10 分鐘回收
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: initialData
      ? { pages: [initialData], pageParams: [undefined] }
      : undefined,
  });

  // 合併並去重
  const products =
    query.data?.pages
      .flatMap((page) => page.products)
      .reduce<
        Record<string, any>
      >((map, product) => ((map[product.id] ??= product), map), {}) ?? {};

  const uniqueProducts = Object.values(products);

  const firstPage = query.data?.pages[0];
  const totalCount = firstPage?.totalCount ?? 0;
  const availableFilters = firstPage?.availableFilters ?? {
    categories: [],
    brands: [],
  };
  const collectionInfo = firstPage?.collectionInfo ?? null;

  return {
    products: uniqueProducts,
    totalCount,
    availableFilters,
    collectionInfo,
    ...query,
  };
};
