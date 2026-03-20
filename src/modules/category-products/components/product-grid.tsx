import ProductItem from "@/modules/product/components/product-item";
import ProductSkeleton from "../ui/product-skeleton";

import { ProductListItem } from "@/types/product/product";

interface ProductGridProps {
  products: ProductListItem[];
  isPending: boolean;
  collectionId?: string;
  categorySlug?: string;
}

const ProductGrid = ({ products, isPending, collectionId, categorySlug }: ProductGridProps) => {
  if (isPending) {
    return <ProductSkeleton />;
  }

  if (products.length === 0) {
    return (
      <div className="flex justify-center">
        <p className="text-neutral-500">尚未有符合的商品</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 transition-all duration-300 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductItem
          product={product}
          key={product.id}
          collectionId={collectionId}
          categorySlug={categorySlug}
          index={index}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
