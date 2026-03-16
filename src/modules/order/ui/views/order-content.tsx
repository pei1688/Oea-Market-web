"use client";

import { getOrders } from "@/action/order/get";
import Spinner from "@/components/spinner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getPaymentMethodLabel,
  getPaymentStatusInfo,
} from "@/lib/config/payment-status";
import { formatDate, formatPrice } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Package, Calendar, CreditCard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const OrderContent = () => {
  const {
    data: orders,
    isPending,
    error,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
  });

  if (isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !orders) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center text-neutral-500">
        <Package className="mb-4 h-16 w-16 opacity-50" />
        <p className="text-lg">尚無訂單記錄</p>
        <p className="text-sm">您還沒有任何訂單，快去購物吧！</p>
      </div>
    );
  }
  const paymentStatusInfo = getPaymentStatusInfo(orders.paymentStatus);
  const paymentMethodLabel = getPaymentMethodLabel(orders.paymentMethod);
  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="ae-profile-title mb-4">訂單資訊</h1>
        <div className="ae-caption text-neutral-600">
          查看您的訂單狀態，與訂單的設定
        </div>
        <Separator className="bg-primary/20 mx-auto mt-8 max-w-7xl" />
      </div>
      <div className="h-[500px] space-y-6 overflow-y-auto">
        <div className="overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-md">
          {/* 訂單標題 */}
          <div className="border-b bg-neutral-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Package className="text-primary h-5 w-5" />
                <h3 className="font-semibold text-neutral-800">
                  訂單編號: {orders.orderItems[0]?.orderId || "未知"}
                </h3>
              </div>
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(orders.orderItems[0]?.createdAt)}</span>
              </div>
            </div>

            {/* 新增的狀態區域 */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {/* 付款狀態 */}
              {orders.paymentStatus && (
                <Badge className={paymentStatusInfo.color}>
                  {paymentStatusInfo.icon}
                  <span className="ml-2">{paymentStatusInfo.text}</span>
                </Badge>
              )}

              {/* 付款方式 */}
              {orders.paymentMethod && (
                <Badge className="flex items-center space-x-2 bg-neutral-200 px-3 py-1">
                  <CreditCard className="size-4 text-neutral-600" />
                  <span className="text-neutral-700">{paymentMethodLabel}</span>
                </Badge>
              )}
            </div>
          </div>

          {/* 訂單商品列表 */}
          <div className="p-6">
            <div className="space-y-4">
              {orders.orderItems.map((item, index) => (
                <Link
                  href={`/account/order/${orders.id}`}
                  key={`${item.id}-${index}`}
                  className="flex items-center space-x-4 rounded-sm bg-neutral-50 p-4"
                >
                  {/* 商品圖片 */}
                  <div className="relative h-20 w-20 flex-shrink-0">
                    <Image
                      src={item.productImage || "/placeholder-image.jpg"}
                      alt={item.productName}
                      className="rounded-sm object-cover"
                      fill
                    />
                  </div>

                  {/* 商品資訊 */}
                  <div className="flex-grow">
                    <h4 className="mb-1 font-medium text-neutral-800">
                      {item.productName}
                    </h4>
                    {item.variantText && (
                      <p className="mb-1 text-sm text-neutral-600">
                        {item.variantText}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-neutral-600">
                      <span>數量: {item.quantity}</span>
                      <span>單價: {formatPrice(item.price)}</span>
                    </div>
                  </div>

                  {/* 小計 */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-lg font-semibold text-neutral-800">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                </Link>
              ))}

              {/* 訂單總計 */}
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-end">
                  <span className="text-md font-medium">訂單總計: </span>
                  <div className="text-2xl font-bold text-fuchsia-600">
                    {formatPrice(
                      orders.orderItems.reduce(
                        (total, item) => total + item.price * item.quantity,
                        0,
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderContent;
