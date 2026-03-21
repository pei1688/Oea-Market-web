"use client";
import Image from "next/image";
import Link from "next/link";
import { ProductListItem } from "@/types/product/product";
import dynamic from "next/dynamic";
import { memo } from "react";
import { calculateDiscountedPrice } from "@/lib/price";
import cloudinaryLoader from "@/lib/cloudinary-loader";

interface ProductItemProps {
  product: ProductListItem;
  collectionId?: string;
  categorySlug?: string;
  index?: number;
}

const ProductDialogItem = dynamic(
  () => import("./product-dialog/product-dialog-item"),
  {
    ssr: false,
    loading: () => (
      <div className="size-6 animate-pulse rounded bg-neutral-200" />
    ),
  },
);

const ProductItem = memo(
  ({ product, collectionId, categorySlug, index }: ProductItemProps) => {
    const discountInfo = calculateDiscountedPrice(
      product.price,
      product.isOnSale,
      product.discountPercentage,
    );

    const href =
      collectionId && categorySlug
        ? `/collections/${collectionId}/${categorySlug}/product/${product.id}`
        : `/product/${product.id}`;

    return (
      <div className="relative aspect-3/4 w-full rounded-sm border border-transparent bg-neutral-100 shadow-lg duration-300 hover:border-fuchsia-500 hover:shadow-2xl">
        {/* Sale badge */}
        {discountInfo.hasDiscount && (
          <div className="ae-small absolute top-2 left-2 z-10 rounded bg-fuchsia-600 px-2 py-1 text-neutral-100">
            -{product.discountPercentage}%
          </div>
        )}

        <Link href={href} className="flex h-full flex-col">
          <div className="relative h-[80%] w-full">
            <Image
              loader={cloudinaryLoader}
              src={product.imgUrl?.[0] || "/default-product.png"}
              alt={product.name}
              className="rounded-t-sm object-cover duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              fill
              priority={index === undefined || index < 4}
              loading={index !== undefined && index >= 4 ? "lazy" : undefined}
              fetchPriority="high"
            />
          </div>

          <div className="ae-body flex flex-col justify-between gap-2 p-2">
            <p className="truncate font-semibold">{product.name}</p>
            <div
              className="flex h-8 w-full items-center justify-between"
              onClick={(e) => e.preventDefault()}
            >
              <div className="flex flex-col">
                {discountInfo.hasDiscount ? (
                  <>
                    <p className="text-xs text-neutral-500 line-through">
                      NT$ {product.price}
                    </p>
                    <p className="font-semibold text-fuchsia-600">
                      NT$ {discountInfo.discountedPrice}
                    </p>
                  </>
                ) : (
                  <p className="font-semibold">NT$ {product.price}</p>
                )}
              </div>
              <ProductDialogItem
                productId={product.id}
                collectionId={collectionId}
              />
            </div>
          </div>
        </Link>
      </div>
    );
  },
);

ProductItem.displayName = "ProductItem";

export default ProductItem;
