import { getProduct, getProductIds } from "@/action/product";
import PageBreadcrumb from "@/components/layout/page-breadcrumb";
import { Separator } from "@/components/ui/separator";
import ProductAlsoLike from "@/modules/product/components/prodcut-alsolike";
import ProductDescription from "@/modules/product/components/product-description";
import ProductDetail from "@/modules/product/components/product-detail/product-detail";

export const revalidate = 300;

export async function generateStaticParams() {
  const product = await getProductIds();
  return product.map((p) => ({
    id: p.id,
  }));
}

const ProductPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product)
    return (
      <div className="mx-auto mt-16 max-w-7xl px-6 md:mt-32 md:px-0">
        <div className="text-center">
          <div className="text-md text-neutral-500">沒有相關商品資料</div>
        </div>
      </div>
    );

  const firstCollection = product.productCollections?.[0]?.collection;

  return (
    <div className="px-6">
      {firstCollection ? (
        <PageBreadcrumb
          grandparentPage={{
            name: "商品系列",
            href: `/collections`,
          }}
          parentPage={{
            name: firstCollection.name,
            href: `/collections/${firstCollection.id}/全部`,
          }}
        />
      ) : (
        <PageBreadcrumb
          parentPage={{
            name: "商品系列",
            href: `/collections`,
          }}
        />
      )}
      <div className="mx-auto mt-12 max-w-7xl space-y-8">
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
    </div>
  );
};

export default ProductPage;
