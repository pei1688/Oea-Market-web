"use client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useVariantStock,
  useStockValidation,
  useProductPrice,
} from "@/hooks/product/use-product-stock";
import { useProductVariants } from "@/hooks/product/use-product-variants";
import { useCartStore } from "@/store/cart-store";
import { ShoppingCart } from "lucide-react";
import { QuantitySelector } from "../product-detail/quantity-selector";
import { VariantSelector } from "../product-detail/variant-selector";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import { ProductDetailProps } from "@/types/product/product-detail";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useProductById } from "@/services/products";
import { ProductDialogImage } from "./product-dialog-image";
import { ProductDialogHeader } from "./product-dialog-header";
import { ProductDialogActions } from "./product-dialog-actions";

// ── 預設選擇計算 ──────────────────────────────────────────────

function computeDefaults(
  product: ProductDetailProps["product"],
  groupedVariants: ReturnType<typeof useProductVariants>["groupedVariants"],
) {
  const selectedVariants: Record<string, string> = {};
  const selectedSpec2: Record<string, string> = {};
  let currentImage = product.imgUrl[0] || "";

  Object.entries(groupedVariants).forEach(([specName, variants]) => {
    if (variants && variants.length > 0) {
      const first = variants[0];
      selectedVariants[specName] = first.id;
      if (first.spec1Image) currentImage = first.spec1Image;
      if (first.spec2Combinations && first.spec2Combinations.length > 0) {
        selectedSpec2[first.id] = first.spec2Combinations[0].id;
      }
    }
  });

  return { currentImage, selectedVariants, selectedSpec2 };
}

// ── 外層 Dialog 觸發器 ────────────────────────────────────────

const ProductDialogItem = ({
  productId,
  collectionId,
}: {
  productId: string;
  collectionId?: string;
}) => {
  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer" asChild>
        <button className="cursor-pointer" aria-label="檢視商品">
          <ShoppingCart className="size-6 text-neutral-800 hover:text-neutral-600" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-4 sm:max-w-3xl">
        <VisuallyHidden>
          <DialogTitle>商品詳情</DialogTitle>
        </VisuallyHidden>
        <ProductDialogContentFetcher productId={productId} collectionId={collectionId} />
      </DialogContent>
    </Dialog>
  );
};

// ── 資料載入層 ────────────────────────────────────────────────

const ProductDialogContentFetcher = ({
  productId,
  collectionId,
}: {
  productId: string;
  collectionId?: string;
}) => {
  const { product, error, isPending } = useProductById({ id: productId });

  if (isPending) {
    return (
      <div className="flex h-125 w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !product) {
    return <div>無法載入商品，請稍後再試。</div>;
  }

  return <ProductDialogDetail product={product} collectionId={collectionId} />;
};

// ── 商品詳情（本地狀態，不共用全域 store）────────────────────

const ProductDialogDetail = ({ product, collectionId }: ProductDetailProps) => {
  const router = useRouter();
  const { addItem } = useCartStore();

  // 變體、庫存處理
  const { groupedVariants } = useProductVariants(product);

  // 本地狀態 — 初始化一次於 mount，不與主頁面 store 共用
  const [currentImage, setCurrentImage] = useState(
    () => computeDefaults(product, groupedVariants).currentImage,
  );
  const [selectedVariants, setSelectedVariants] = useState(
    () => computeDefaults(product, groupedVariants).selectedVariants,
  );
  const [selectedSpec2, setSelectedSpec2] = useState(
    () => computeDefaults(product, groupedVariants).selectedSpec2,
  );
  const [quantity, setQuantity] = useState(1);

  const { variantInfo, isAllVariantsSelected } = useVariantStock(
    product,
    groupedVariants,
    { selectedVariants, selectedSpec2 },
  );
  const stockValidation = useStockValidation(product.id, variantInfo, { quantity });
  const priceInfo = useProductPrice(product, variantInfo);

  // 處理變體選擇
  const handleVariantSelect = (specName: string, variant: any) => {
    setSelectedVariants({
      ...selectedVariants,
      [specName]: variant.id,
    });

    const newSpec2: Record<string, string> = {};
    if (selectedSpec2[variant.id]) {
      newSpec2[variant.id] = selectedSpec2[variant.id];
    } else if (variant.spec2Combinations?.length > 0) {
      newSpec2[variant.id] = variant.spec2Combinations[0].id;
    }
    setSelectedSpec2(newSpec2);

    if (variant.spec1Image) {
      setCurrentImage(variant.spec1Image);
    }
  };

  // 處理規格2選擇
  const handleSpec2Select = (variantId: string, spec2: any) => {
    setSelectedSpec2({
      ...selectedSpec2,
      [variantId]: spec2.id,
    });
  };

  // 生成變體文字
  const generateVariantText = () => {
    if (!product.variants) return "";

    const variantTexts = Object.entries(selectedVariants).flatMap(
      ([specName, variantId]) => {
        const variant = product.variants?.find((v) => v.id === variantId);
        if (!variant) return [];

        const texts = [`${specName}: ${variant.spec1Value}`];

        const spec2Id = selectedSpec2[variantId];
        const spec2 = variant.spec2Combinations?.find((s) => s.id === spec2Id);

        if (spec2) {
          texts.push(`${spec2.spec2Name}: ${spec2.spec2Value}`);
        }

        return texts;
      },
    );

    return variantTexts.join(", ");
  };

  // 驗證選擇
  const validateSelection = () => {
    if (Object.keys(groupedVariants).length > 0 && !isAllVariantsSelected) {
      toast.error("請選擇所有商品選項");
      return false;
    }

    if (stockValidation.isExceeded) {
      if (stockValidation.cartQuantity >= stockValidation.currentStock) {
        toast.error("該商品已達到庫存上限，無法再加入購物車");
      } else {
        toast.error(
          `最多只能再加入 ${stockValidation.availableQuantity} 件商品`,
        );
      }
      return false;
    }

    return true;
  };

  // 創建購物車項目
  const createCartItem = () => ({
    productId: product.id,
    name: product.name,
    price: priceInfo.finalPrice,
    image: currentImage,
    quantity,
    selectedVariants,
    variantText: generateVariantText(),
    stock: stockValidation.currentStock,
    variantId: variantInfo.variantId,
    spec2Id: variantInfo.spec2Id,
    collectionId,
  });

  const handleAddToCart = () => {
    if (!validateSelection()) return;
    addItem(createCartItem());
  };

  const handleBuyNow = (): void => {
    if (!validateSelection()) return;
    addItem(createCartItem());
    router.push("/cart");
  };

  const isDisabled =
    variantInfo.stock === 0 ||
    (Object.keys(groupedVariants).length > 0 && !isAllVariantsSelected);

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <ProductDialogImage
          imageUrl={currentImage || "/default-product.png"}
          altText={product.name}
        />
        <div className="flex flex-col">
          <ProductDialogHeader
            name={product.name}
            price={priceInfo.finalPrice}
            isOnSale={product.isOnSale}
            discountPercentage={product.discountPercentage}
          />

          <div className="grow">
            <VariantSelector
              groupedVariants={groupedVariants}
              product={product}
              onVariantSelect={handleVariantSelect}
              onSpec2Select={handleSpec2Select}
              selectedVariants={selectedVariants}
              selectedSpec2={selectedSpec2}
            />
          </div>
          <QuantitySelector
            stock={variantInfo.stock}
            quantity={quantity}
            onQuantityChange={setQuantity}
          />
        </div>
      </div>
      <ProductDialogActions
        onBuyNow={handleBuyNow}
        onAddToCart={handleAddToCart}
        disabled={isDisabled}
      />
    </div>
  );
};

export default ProductDialogItem;
