import { ProductPriceInfo } from "@/hooks/product/use-product-price";
import { ProductDetailProps } from "@/types/product/product-detail";

interface ProductInfoProps {
  product: ProductDetailProps["product"];
  priceInfo: ProductPriceInfo;
}

export const ProductInfo = ({ product, priceInfo }: ProductInfoProps) => {
  return (
    <div className="flex flex-col space-y-2">
      <h1 className="ae-home-title">{product.name}</h1>
      <h2 className="ae-home-subTitle">{product.category?.name || ""}</h2>

      {/* 價格顯示區域 */}
      <div className="flex flex-col space-y-2">
        {priceInfo.hasDiscount ? (
          <>
            {/* 價格組合 */}
            <div className="ae-sub-section-title flex items-center space-x-3">
              {/* 特價價格 */}
              <span className="font-bold text-fuchsia-600">
                NT${priceInfo.discountedPrice.toLocaleString()}
              </span>

              {/* 原價（劃線） */}
              <span className="line-through">
                NT${priceInfo.originalPrice.toLocaleString()}
              </span>

              {/* 折扣百分比 */}
              <span className="font-semibold text-fuchsia-600">
                {Math.round(priceInfo.discountPercentage)}%折扣
              </span>
            </div>
          </>
        ) : (
          /* 一般價格 */
          <div className="ae-sub-section-title">
            NT${priceInfo.finalPrice.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};
