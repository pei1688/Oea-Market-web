import { getProduct, getProductIds } from "@/action/product";
import { Separator } from "@/components/ui/separator";
import ProductAlsoLike from "@/modules/product/components/prodcut-alsolike";
import ProductDescription from "@/modules/product/components/product-description";
import ProductDetail from "@/modules/product/components/product-detail/product-detail";

export const revalidate = 300;
export async function generateStaticParams() {
  const product = await getProductIds();
  return product.map((p) => ({
    productId: p.id,
  }));
}

const ProductPage = async ({
  params,
}: {
  params: Promise<{ productId: string }>;
}) => {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product)
    return (
      <div className="mx-auto mt-16 max-w-7xl px-6 md:mt-32 md:px-0">
        <div className="text-center">
          <div className="text-md text-neutral-500">沒有相關商品資料</div>
        </div>
      </div>
    );
  return (
    <div className="mx-auto mt-16 max-w-7xl space-y-8 px-6 md:mt-32 md:px-0">
      {/* Product Content */}
      <ProductDetail product={product} />
      <Separator className="bg-primary/20 my-8" />
      <ProductDescription description={product.description} />
      <div className="bg-primary/20 h-px w-full" />
      <div className="flex w-full flex-col items-center">
        <h2 className="ae-section-title mb-8">你可能也喜歡</h2>
        <ProductAlsoLike
          categoryId={product.categoryId}
          productId={product.id}
        />
      </div>
    </div>
  );
};

export default ProductPage;
