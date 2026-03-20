import { getCollectionById, getCollections } from "@/action/collection";
import { getInfiniteFilteredProductsByCollection } from "@/action/product";
import PageBreadcrumb from "@/components/layout/page-breadcrumb";
import CategoryProductsContent from "@/modules/category-products/ui/view/category-products-content";
import { type Metadata } from "next";
export const revalidate = 300;

export async function generateStaticParams() {
  const collections = await getCollections();

  const params: { collectionId: string; categorySlug: string }[] = [];

  for (const c of collections) {
    params.push({ collectionId: c.id, categorySlug: "全部" });

    const collectionCategories = Array.from(
      new Set(c.productCollections.map((pc) => pc.product.category.name)),
    ).slice(0, 5);

    for (const catName of collectionCategories) {
      params.push({ collectionId: c.id, categorySlug: catName });
    }
  }

  return params;
}

interface Props {
  params: Promise<{ collectionId: string; categorySlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collectionId } = await params;
  const collection = await getCollectionById(collectionId);
  const name = collection?.name ?? "商品系列";
  return {
    title: name,
    description: `瀏覽 ${name} 系列商品，探索 Oea Market 精選代購商品。`,
    alternates: {
      canonical: `/collections/${collectionId}/全部`,
    },
    openGraph: {
      title: `${name} | Oea`,
      description: `瀏覽 ${name} 系列商品，探索 Oea Market 精選代購商品。`,
    },
  };
}

export default async function CategoryProductsPage({ params }: Props) {
  const { collectionId, categorySlug } = await params;

  const initialData = await getInfiniteFilteredProductsByCollection({
    collectionId,
    categorySlug: decodeURIComponent(categorySlug),
  });

  if (!initialData.collectionInfo) {
    return (
      <div className="mx-auto mt-16 max-w-7xl px-6 md:my-32 md:px-0">
        <div className="text-center">
          <div className="text-md text-neutral-500">沒有相關商品資料</div>
        </div>
      </div>
    );
  }

  const { collectionInfo } = initialData;
  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-6">
        {collectionInfo && (
          <PageBreadcrumb
            grandparentPage={{
              name: "商品系列",
              href: `/collections`,
            }}
            parentPage={{
              name: collectionInfo.name,
              href: `/collections/${collectionInfo.id}/全部`,
            }}
          />
        )}
      </div>

      <CategoryProductsContent
        collectionId={collectionId}
        categorySlug={categorySlug}
        initialData={initialData}
      />
    </div>
  );
}
