import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCollectionById } from "@/action/collection";
import { NEW_ARRIVALS_COLLECTION_ID } from "@/config/constants";
import { ChevronRight } from "lucide-react";
import ProductItem from "@/modules/product/components/product-item";

const ProductList = async () => {
  const collection = await getCollectionById(NEW_ARRIVALS_COLLECTION_ID);
  if (!collection) return null;

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col space-y-6 px-6">
      <div className="flex flex-col gap-3">
        <h2 className="ae-home-title">新品上市</h2>
        <span className="ae-home-subTitle">新的代購商品上架囉!</span>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {collection.productCollections.slice(0, 8).map((pc) => (
          <ProductItem
            product={pc.product}
            key={pc.id}
            collectionId={NEW_ARRIVALS_COLLECTION_ID}
            categorySlug="全部"
          />
        ))}
      </div>

      <Button variant="outline" asChild className="block h-25 text-2xl">
        <Link href={`/collections/${NEW_ARRIVALS_COLLECTION_ID}/全部`} className="flex items-center">
          <p>查看更多</p>
          <ChevronRight className="size-12" />
        </Link>
      </Button>
    </section>
  );
};

export default ProductList;
