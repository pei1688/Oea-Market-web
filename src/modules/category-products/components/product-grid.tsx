import ProductItem from "@/modules/product/components/product-item";
import ProductSkeleton from "../ui/product-skeleton";

import { ProductListItem } from "@/types/product/product";

interface ProductGridProps {
  products: ProductListItem[];
  isPending: boolean;
}

const ProductGrid = ({ products, isPending }: ProductGridProps) => {
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
      {products.map((product) => (
        <ProductItem product={product} key={product.id} />
      ))}
    </div>
  );
};

export default ProductGrid;
