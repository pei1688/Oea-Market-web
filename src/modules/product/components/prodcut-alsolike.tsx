"use client";
import Spinner from "@/components/spinner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useRelatedProducts } from "@/services/products";
import { RelatedProductProps } from "@/types/product/product";
import ProductItem from "./product-item";

const ProductAlsoLike = ({ categoryId, productId }: RelatedProductProps) => {
  const { products, error, isPending } = useRelatedProducts({
    categoryId,
    productId,
  });

  if (isPending) {
    return <Spinner />;
  }

  if (error) {
    return <div className="text-neutral-500">推薦商品載入失敗</div>;
  }

  if (!products || products.length === 0) {
    return <div className="text-neutral-500">敬請期待</div>;
  }

  return (
    <Carousel className="relative w-full">
      <CarouselPrevious className="absolute top-1/2 -left-12 hidden -translate-y-1/2 md:block" />
      <CarouselContent>
        {products.map((pd) => (
          <CarouselItem
            key={pd.id}
            className="max-w-xs basis-full sm:basis-1/2 lg:basis-1/3"
          >
            <ProductItem product={pd} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselNext className="absolute top-1/2 -right-12 hidden -translate-y-1/2 md:block" />
    </Carousel>
  );
};

export default ProductAlsoLike;
