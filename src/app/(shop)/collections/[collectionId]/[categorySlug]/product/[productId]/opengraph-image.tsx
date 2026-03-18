import { ImageResponse } from "next/og";
import { getProduct } from "@/action/product";
import { calculateDiscountedPrice } from "@/lib/price";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  // getProduct() may return undefined (error) or null (not found) — both use fallback
  const product = await getProduct(productId);

  const imgUrl =
    product?.imgUrl?.[0]?.startsWith("https://")
      ? product.imgUrl[0]
      : null;

  let displayPrice = product?.price ?? 0;
  if (product) {
    const info = calculateDiscountedPrice(
      product.price,
      product.isOnSale,
      product.discountPercentage,
    );
    if (info.hasDiscount) displayPrice = info.discountedPrice;
  }

  // Fallback: full gradient when no valid image URL or product not found
  if (!imgUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(to right, #fcabdd, #b62892)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: "white",
            }}
          >
            <span style={{ fontSize: 32, opacity: 0.8 }}>Oea Market</span>
            <span
              style={{
                fontSize: 56,
                fontWeight: "bold",
                marginTop: 16,
                textAlign: "center",
                padding: "0 40px",
              }}
            >
              {product?.name ?? "商品"}
            </span>
            <span style={{ fontSize: 40, marginTop: 12, color: "#f9a8d4" }}>
              NT$ {displayPrice}
            </span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* Left half: product image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgUrl}
          alt=""
          style={{ width: 600, height: 630, objectFit: "cover" }}
        />
        {/* Right half: gradient + text */}
        <div
          style={{
            width: 600,
            height: 630,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "40px 48px",
            background: "linear-gradient(to bottom right, #fcabdd, #b62892)",
          }}
        >
          <span
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.8)",
              marginBottom: 16,
            }}
          >
            Oea Market
          </span>
          <span
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: "white",
              lineHeight: 1.2,
              marginBottom: 24,
            }}
          >
            {product?.name ?? "商品"}
          </span>
          <span style={{ fontSize: 36, color: "white", fontWeight: "bold" }}>
            NT$ {displayPrice}
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
