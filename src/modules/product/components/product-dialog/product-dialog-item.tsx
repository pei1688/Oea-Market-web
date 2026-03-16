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
import { useProductDetailStore } from "@/store/product-detail-store";
import { ShoppingCart } from "lucide-react";
import { QuantitySelector } from "../product-detail/quantity-selector";
import { VariantSelector } from "../product-detail/variant-selector";
import { toast } from "sonner";
import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import { ProductDetailProps } from "@/types/product/product-detail";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useProductById } from "@/services/products";
import { ProductDialogImage } from "./product-dialog-image";
import { ProductDialogHeader } from "./product-dialog-header";
import { ProductDialogActions } from "./product-dialog-actions";

const ProductDialogItem = ({ productId }: { productId: string }) => {
  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer" asChild>
        <ShoppingCart className="size-6 text-neutral-800 hover:text-neutral-600" />
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-4 sm:max-w-3xl">
        <VisuallyHidden>
          <DialogTitle>商品詳情</DialogTitle>
        </VisuallyHidden>
        <ProductDialogContentFetcher productId={productId} />
      </DialogContent>
    </Dialog>
  );
};

const ProductDialogContentFetcher = ({ productId }: { productId: string }) => {
  const { product, error, isPending } = useProductById({ id: productId });

  if (isPending) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !product) {
    return <div>無法載入商品，請稍後再試。</div>;
  }

  return <ProductDialogDetail product={product} />;
};

const ProductDialogDetail = ({ product }: ProductDetailProps) => {
  const router = useRouter();
  const { addItem } = useCartStore();
  const {
    currentImage,
    selectedVariants,
    selectedSpec2,
    quantity,
    currentProductId, // 獲取當前商品ID狀態
    setCurrentImage,
    setSelectedVariants,
    setSelectedSpec2,
    setQuantity,
    setCurrentProductId, // 獲取設置商品ID的方法
    initializeWithDefaults,
  } = useProductDetailStore();

  //變體、庫存的處裡
  const { groupedVariants } = useProductVariants(product);
  const { variantInfo, isAllVariantsSelected } = useVariantStock(
    product,
    groupedVariants,
  );
  const stockValidation = useStockValidation(product.id, variantInfo);
  const priceInfo = useProductPrice(product, variantInfo);

  // 生成預設變體選擇
  const generateDefaultSelections = useCallback(() => {
    const defaultVariants: Record<string, string> = {};
    const defaultSpec2: Record<string, string> = {};
    let defaultImage = product.imgUrl[0] || "";

    // 為每個規格選擇第一個變體
    Object.entries(groupedVariants).forEach(([specName, variants]) => {
      if (variants.length > 0) {
        const firstVariant = variants[0];
        defaultVariants[specName] = firstVariant.id;

        // 如果第一個變體有圖片，使用它作為預設圖片
        if (firstVariant.spec1Image) {
          defaultImage = firstVariant.spec1Image;
        }

        // 如果第一個變體有規格2，選擇第一個規格2
        if (
          firstVariant.spec2Combinations &&
          firstVariant.spec2Combinations.length > 0
        ) {
          defaultSpec2[firstVariant.id] = firstVariant.spec2Combinations[0].id;
        }
      }
    });

    return { defaultVariants, defaultSpec2, defaultImage };
  }, [product.imgUrl, groupedVariants]);

  // 檢查並重置狀態 - 當商品ID變化時
  useEffect(() => {
    if (currentProductId !== product.id) {
      // 商品變化，初始化預設選擇
      const { defaultVariants, defaultSpec2, defaultImage } =
        generateDefaultSelections();
      initializeWithDefaults(defaultImage, defaultVariants, defaultSpec2);
      setCurrentProductId(product.id);
    } else if (!currentImage && product.imgUrl[0]) {
      // 同一商品但沒有圖片，設置默認圖片
      setCurrentImage(product.imgUrl[0]);
    }
  }, [
    product.id,
    product.imgUrl,
    currentProductId,
    currentImage,
    generateDefaultSelections,
    initializeWithDefaults,
    setCurrentImage,
    setCurrentProductId,
  ]);

  // 處理變體選擇
  const handleVariantSelect = (specName: string, variant: any) => {
    // 直接選擇變體，不允許取消選擇
    setSelectedVariants({
      ...selectedVariants,
      [specName]: variant.id,
    });

    // 保留當前變體的規格2選擇，清除其他變體的規格2選擇
    const newSpec2: Record<string, string> = {};
    if (selectedSpec2[variant.id]) {
      newSpec2[variant.id] = selectedSpec2[variant.id];
    } else if (variant.spec2Combinations?.length > 0) {
      // 如果沒有選擇規格2，自動選擇第一個
      newSpec2[variant.id] = variant.spec2Combinations[0].id;
    }
    setSelectedSpec2(newSpec2);

    // 更新圖片
    if (variant.spec1Image) {
      setCurrentImage(variant.spec1Image);
    }
  };

  // 處理規格2選擇
  const handleSpec2Select = (variantId: string, spec2: any) => {
    // 直接選擇規格2，不允許取消選擇
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
  });

  const handleAddToCart = () => {
    if (!validateSelection()) return;

    const cartItem = createCartItem();
    addItem(cartItem);
  };

  const handleBuyNow = (): void => {
    if (!validateSelection()) return;

    const cartItem = createCartItem();
    addItem(cartItem);
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

          <div className="flex-grow">
            <VariantSelector
              groupedVariants={groupedVariants}
              product={product}
              onVariantSelect={handleVariantSelect}
              onSpec2Select={handleSpec2Select}
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
