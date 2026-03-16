"use client";

import { getOrderById } from "@/action/order/get";
import Spinner from "@/components/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getPaymentMethodLabel,
  getPaymentStatusInfo,
} from "@/lib/config/payment-status";
import { formatPrice } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Calendar,
  CreditCard,
  MapPin,
  Phone,
  User,
  Truck,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
interface OrderIdProps {
  orderId: string;
}
const OrderIdContent = ({ orderId }: OrderIdProps) => {
  const {
    data: order,
    isPending,
    error,
  } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderById(orderId),
  });

  if (isPending) {
    return <Spinner />;
  }

  if (error || !order) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="text-destructive text-center">
          <p>載入訂單詳情時發生錯誤</p>
          <p className="mt-2 text-sm">請稍後再試或返回訂單列表</p>
          <Link href="/account/order" className="mt-4 inline-block">
            <Button variant="outline">返回訂單列表</Button>
          </Link>
        </div>
      </div>
    );
  }
  const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus);
  const paymentMethodLabel = getPaymentMethodLabel(order.paymentMethod);

  // 計算訂單總金額
  const totalAmount =
    order.orderItems?.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    ) || 0;

  return (
    <div className="container mx-auto max-w-4xl">
      {/* 頁面標題與導航 */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link href="/account/order">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回訂單列表
            </Button>
          </Link>
          <div className="text-sm text-neutral-600">訂單編號: {order.id}</div>
        </div>
        <div>
          <h1 className="ae-profile-title mb-2">訂單詳細資訊</h1>
        </div>
        <Separator className="bg-primary/20 mx-auto mt-8" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左側主要內容 */}
        <div className="space-y-6 lg:col-span-2">
          {/* 訂單狀態卡片 */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Package className="text-primary size-5" />
                訂單狀態
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3 px-6">
                {/* 付款狀態 */}
                {order.paymentStatus && (
                  <Badge className={paymentStatusInfo.color}>
                    {paymentStatusInfo.icon}
                    <span className="ml-2">{paymentStatusInfo.text}</span>
                  </Badge>
                )}

                {/* 訂單狀態 */}
                {order.status && (
                  <Badge className="flex items-center space-x-2 bg-blue-100 text-blue-800">
                    <Truck className="h-4 w-4" />
                    <span>{order.status}</span>
                  </Badge>
                )}

                {/* 付款方式 */}
                {order.paymentMethod && (
                  <Badge className="flex items-center space-x-2 bg-neutral-200 px-3 py-1">
                    <CreditCard className="h-4 w-4 text-neutral-600" />
                    <span className="text-neutral-700">
                      {paymentMethodLabel}
                    </span>
                  </Badge>
                )}
              </div>

              {/* 訂單時間軸 */}
              <div className="mt-6 px-6">
                <h4 className="mb-3 font-medium">訂單進度</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <div className="flex-1">
                      <div className="font-medium">訂單已確認</div>
                      <div className="text-sm text-neutral-600">
                        訂單編號: {order.id}
                      </div>
                    </div>
                  </div>

                  {order.paymentStatus === "paid" && (
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <div className="flex-1">
                        <div className="font-medium">付款完成</div>
                        <div className="text-sm text-neutral-600">
                          使用 {paymentMethodLabel} 付款
                        </div>
                      </div>
                    </div>
                  )}

                  {order.status && order.status !== "pending" && (
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <div className="flex-1">
                        <div className="font-medium">訂單處理中</div>
                        <div className="text-sm text-neutral-600">
                          狀態: {order.status}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 商品列表 */}
          <Card>
            <CardHeader>
              <CardTitle>訂單商品</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderItems?.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex items-center space-x-4 rounded-lg bg-neutral-50 p-4"
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
                        <p className="mb-2 text-sm text-neutral-600">
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右側邊欄 */}
        <div className="space-y-6">
          {/* 訂單摘要 */}
          <Card>
            <CardHeader>
              <CardTitle>訂單摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-6">
              <div className="flex justify-between text-sm">
                <span>商品小計</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>

              {/* {order.shippingFee && (
                <div className="flex justify-between text-sm">
                  <span>運費</span>
                  <span>{formatPrice(order.shippingFee)}</span>
                </div>
              )}

              {order.discount && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>折扣</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )} */}

              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>訂單總計</span>
                <span className="text-fuchsia-600">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 配送資訊 */}
          {(order.address || order.name || order.phoneNumber) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  配送資訊
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-6">
                {order.name && (
                  <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center gap-1">
                      {" "}
                      <User className="mt-1 size-4 text-neutral-600" />
                      {order.name}
                    </div>
                    {order.phoneNumber && (
                      <div className="flex items-center gap-1 text-sm text-neutral-600">
                        <Phone className="size-3" />
                        {order.phoneNumber}
                      </div>
                    )}
                  </div>
                )}

                {order.address && (
                  <div className="text-sm text-neutral-700">
                    {order.address}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 訂單資訊 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" />
                訂單資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-6 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">付款方式</span>
                <span>{paymentMethodLabel}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-600">付款狀態</span>
                <span>{paymentStatusInfo.text}</span>
              </div>

              {order.status && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">訂單狀態</span>
                  <span>{order.status}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderIdContent;
