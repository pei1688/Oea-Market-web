"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckoutItemsTable } from "../../components/checkout-items-table";
import { OrderInfo } from "../../components/order-info";
import { CartContentProps } from "@/types/checkout";
import { useCheckout } from "@/hooks/use-checkout";

const CheckOutContent = ({ profile }: CartContentProps) => {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    checkoutItems,
    checkoutTotalItems,
    checkoutTotalPrice,
    selectedAddress,
    isAddressDialogOpen,
    setIsAddressDialogOpen,
    handleQuantityChange,
    handleBackToCart,
    handleAddressSelect,
    handleOnlinePayment,
    handleCODOrder,
  } = useCheckout(profile);

  // 處理付款邏輯
  const handlePayment = async (method: "cod" | "online") => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      if (method === "cod") {
        // 取貨付款直接下單
        await handleCODOrder();
      } else {
        // 線上付款使用 Stripe
        await handleOnlinePayment();
      }
    } catch (error) {
      console.error("付款處理失敗:", error);
      alert("付款處理失敗，請稍後再試");
    } finally {
      setIsProcessing(false);
    }
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <span className="text-lg">沒有選擇任何商品</span>
        <Button onClick={() => router.push("/cart")}>返回購物車</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="ae-checkout-title">結帳</h1>
        <Button variant="link" onClick={handleBackToCart}>
          返回購物車
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <CheckoutItemsTable
          items={checkoutItems}
          onQuantityChange={handleQuantityChange}
        />
        <OrderInfo
          profile={profile}
          selectedAddress={selectedAddress}
          totalItems={checkoutTotalItems}
          totalPrice={checkoutTotalPrice}
          isAddressDialogOpen={isAddressDialogOpen}
          onAddressDialogChange={setIsAddressDialogOpen}
          onAddressSelect={handleAddressSelect}
          onPlaceOrder={handlePayment}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
};

export default CheckOutContent;
