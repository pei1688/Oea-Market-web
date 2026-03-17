import { getCollectionById, getCollections } from "@/action/collection";
import { getProduct } from "@/action/product";
import PageBreadcrumb from "@/components/layout/page-breadcrumb";
import { Separator } from "@/components/ui/separator";
import ProductAlsoLike from "@/modules/product/components/prodcut-alsolike";
import ProductDescription from "@/modules/product/components/product-description";
import ProductDetail from "@/modules/product/components/product-detail/product-detail";

export const revalidate = 300;

export async function generateStaticParams() {
  const collections = await getCollections();
  const params: {
    collectionId: string;
    categorySlug: string;
    productId: string;
  }[] = [];

  for (const c of collections) {
    const categorySlugValues = [
      "全部",
      ...Array.from(
        new Set(c.productCollections.map((pc) => pc.product.category.name)),
      ).slice(0, 5),
    ];
    for (const categorySlug of categorySlugValues) {
      for (const pc of c.productCollections) {
        params.push({
          collectionId: c.id,
          categorySlug,
          productId: pc.product.id,
        });
      }
    }
  }

  return params;
}

const CollectionProductPage = async ({
  params,
}: {
  params: Promise<{
    collectionId: string;
    categorySlug: string;
    productId: string;
  }>;
}) => {
  const { collectionId, categorySlug, productId } = await params;

  const [product, collection] = await Promise.all([
    getProduct(productId),
    getCollectionById(collectionId),
  ]);

  if (!product)
    return (
      <div className="mx-auto mt-16 max-w-7xl px-6 md:mt-32 md:px-0">
        <div className="text-center">
          <div className="text-md text-neutral-500">沒有相關商品資料</div>
        </div>
      </div>
    );

  return (
    <div className="px-6">
      <PageBreadcrumb
        grandparentPage={{
          name: "商品系列",
          href: `/collections`,
        }}
        parentPage={{
          name: collection?.name ?? "商品系列",
          href: `/collections/${collectionId}/${categorySlug}`,
        }}
        currentPageName={product.name}
      />
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

export default CollectionProductPage;
