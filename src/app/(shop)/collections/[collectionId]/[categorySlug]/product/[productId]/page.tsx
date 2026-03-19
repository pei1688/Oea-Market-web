import { getCollectionById, getCollections } from "@/action/collection";
import { getProduct } from "@/action/product";
import PageBreadcrumb from "@/components/layout/page-breadcrumb";
import { Separator } from "@/components/ui/separator";
import { calculateDiscountedPrice } from "@/lib/price";
import ProductAlsoLike from "@/modules/product/components/prodcut-alsolike";
import ProductDescription from "@/modules/product/components/product-description";
import ProductDetail from "@/modules/product/components/product-detail/product-detail";
import { type Metadata } from "next";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    collectionId: string;
    categorySlug: string;
    productId: string;
  }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProduct(productId);
  const title = product?.name ?? "商品";
  const description = product?.description?.slice(0, 120) ?? "";
  return {
    title,
    description,
    openGraph: {
      title: `${title} | Oea`,
      description,
    },
  };
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
      <div className="mx-auto mt-16 max-w-7xl px-3 md:mt-32 md:px-5">
        <div className="text-center">
          <div className="text-md text-neutral-500">沒有相關商品資料</div>
        </div>
      </div>
    );

  const discountInfo = calculateDiscountedPrice(
    product.price,
    product.isOnSale,
    product.discountPercentage,
  );
  const finalPrice = discountInfo.hasDiscount
    ? discountInfo.discountedPrice
    : product.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.imgUrl ?? [],
    offers: {
      "@type": "Offer",
      priceCurrency: "TWD",
      price: finalPrice,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Oea Market",
      },
      url: `https://oea-market-web.vercel.app/collections/${collectionId}/${categorySlug}/product/${productId}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="px-3 md:px-5">
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
          <ProductDetail product={product} collectionId={collectionId} />
          <Separator className="bg-primary/20 my-8" />
          <ProductDescription description={product.description} />
          <div className="bg-primary/20 h-px w-full" />
          <div className="flex w-full flex-col items-center">
            <div className="ae-section-title mb-8">你可能也喜歡</div>
            <ProductAlsoLike
              collectionId={collectionId}
              categoryId={product.categoryId}
              productId={product.id}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default CollectionProductPage;
