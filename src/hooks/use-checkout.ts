"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { Address } from "@prisma/client";
import { ProfileWithAddress } from "@/types/checkout";

export const useCheckout = (profile: ProfileWithAddress) => {
  const router = useRouter();
  const {
    checkoutItems,
    checkoutTotalItems,
    checkoutTotalPrice,
    updateCheckoutItemQuantity,
    clearCheckoutItems,
  } = useCartStore();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);

  // 初始化選中地址
  useEffect(() => {
    if (profile.Address.length > 0) {
      const defaultAddress = profile.Address.find((addr) => addr.isDefault);
      setSelectedAddress(defaultAddress || profile.Address[0]);
    }
  }, [profile.Address]);

  // 如果沒有結帳商品，重導向回購物車
  useEffect(() => {
    if (checkoutItems.length === 0) {
      router.push("/cart");
    }
  }, [checkoutItems.length, router]);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      updateCheckoutItemQuantity(itemId, newQuantity);
    }
  };

  const handleBackToCart = () => {
    clearCheckoutItems();
    router.push("/cart");
  };

  const handlePlaceOrder = async (
    paymentMethod: "cod" | "online",
    paymentStatus: "UNPAID" | "PAID",
  ) => {
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: checkoutItems,
          address: selectedAddress,
          totalPrice: checkoutTotalPrice,
          paymentMethod,
          paymentStatus,
        }),
      });

      if (!response.ok) throw new Error("建立訂單失敗");

      const { orderId } = await response.json();
      router.push(`/order/success?id=${orderId}`);
    } catch (err) {
      console.error("下單失敗", err);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    const address = profile.Address.find((addr) => addr.id === addressId);
    if (address) {
      setSelectedAddress(address);
      setIsAddressDialogOpen(false);
    }
  };
  // 處理取貨付款訂單
  const handleCODOrder = async () => {
    try {
      const orderData = {
        items: checkoutItems.map((item) => ({
          productId: item.productId,
          productName: item.name,
          productImage: item.image,
          price: item.price,
          quantity: item.quantity,
          variantText: item.variantText,
          variantId: item.variantId,
          spec2Id: item.spec2Id,
        })),
        totalItems: checkoutTotalItems,
        totalPrice: checkoutTotalPrice,
        address: selectedAddress,
        paymentMethod: "cod",
        paymentStatus: "UNPAID",
        status: "PENDING",
      };

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "訂單建立失敗");
      }

      const { orderId } = await response.json();

      // 清空購物車並跳轉到成功頁面
      clearCheckoutItems();
      router.push(`/order/success?orderId=${orderId}&paymentStatus=unpaid`);
    } catch (error) {
      console.error("COD 訂單建立失敗:", error);
      throw error;
    }
  };
  // 處理線上付款訂單
  const handleOnlinePayment = async () => {
    try {
      // 創建訂單
      const orderData = {
        items: checkoutItems.map((item) => ({
          productId: item.productId,
          productName: item.name,
          productImage: item.image,
          price: item.price,
          quantity: item.quantity,
          variantText: item.variantText,
          variantId: item.variantId,
          spec2Id: item.spec2Id,
        })),
        totalItems: checkoutTotalItems,
        totalPrice: checkoutTotalPrice,
        address: selectedAddress,
        paymentMethod: "online",
        paymentStatus: "PENDING",
        status: "PENDING_PAYMENT",
      };

      // 調用 API 創建 Stripe 付款
      const response = await fetch("/api/payment/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "付款請求失敗");
      }

      const { sessionUrl } = await response.json();

      // 重定向到 Stripe 付款頁面
      window.location.href = sessionUrl;
    } catch (error) {
      console.error("線上付款處理失敗:", error);
      throw error;
    }
  };

  return {
    checkoutItems,
    checkoutTotalItems,
    checkoutTotalPrice,
    selectedAddress,
    isAddressDialogOpen,
    setIsAddressDialogOpen,
    handleQuantityChange,
    handleBackToCart,
    handlePlaceOrder,
    handleAddressSelect,
    handleOnlinePayment,
    handleCODOrder,
  };
};
