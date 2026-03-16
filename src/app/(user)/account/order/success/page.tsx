"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  getOrderStatusInfo,
  getPaymentStatusInfo,
} from "@/lib/config/payment-status";
import { Order } from "@/types/order";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get("orderId");
  const sessionId = searchParams.get("session_id");

  const fetchOrderDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);

      if (!response.ok) {
        throw new Error("無法獲取訂單資訊");
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "獲取訂單失敗");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      setError("找不到訂單資訊");
      setLoading(false);
      return;
    }

    fetchOrderDetails();
  }, [sessionId, fetchOrderDetails, orderId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="border-primary h-32 w-32 animate-spin rounded-full border-b-2"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-destructive mb-4 text-2xl font-bold">
              發生錯誤
            </h1>
            <p className="mb-6 text-neutral-600">{error || "找不到訂單資訊"}</p>
            <Link href="/">
              <Button>返回首頁</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus);
  const orderStatusInfo = getOrderStatusInfo(order.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* 成功標題 */}
        <div className="mb-8 text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
          <h1 className="mb-2 text-3xl font-bold text-neutral-900">
            訂單建立成功！
          </h1>
          <p className="text-neutral-600">
            訂單編號：
            <span className="font-mono font-semibold">{order.id}</span>
          </p>
        </div>

        {/* 訂單狀態 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5" />
              訂單狀態
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">付款狀態</span>
                <Badge className={paymentStatusInfo.color}>
                  {paymentStatusInfo.icon}
                  <span className="ml-2">{paymentStatusInfo.text}</span>
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">訂單狀態</span>
                <Badge className={orderStatusInfo.color}>
                  {orderStatusInfo.icon}
                  <span className="ml-2">{orderStatusInfo.text}</span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 訂單詳情 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>訂單詳情</CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-semibold text-neutral-900">
                    收貨資訊
                  </h4>
                  <p className="text-neutral-600">收貨人：{order.name}</p>
                  <p className="text-neutral-600">電話：{order.phoneNumber}</p>
                  <p className="text-neutral-600">地址：{order.address}</p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-neutral-900">
                    付款資訊
                  </h4>
                  <p className="text-neutral-600">
                    付款方式：
                    {order.paymentMethod === "cod" ? "取貨付款" : "線上付款"}
                  </p>
                  <p className="text-neutral-600">
                    下單時間：
                    {new Date(order.createdAt).toLocaleString("zh-TW")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 商品列表 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>商品明細</CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <div className="space-y-4">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="relative size-16">
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      className="rounded object-cover"
                      fill
                      quality={60}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.productName}</h4>
                    {item.variantText && (
                      <p className="text-sm text-neutral-600">
                        {item.variantText}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      NT$ {item.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-neutral-600">
                      數量：{item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">總計</span>
              <span className="text-primary text-xl font-bold">
                NT$ {order.totalPrice.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 後續提醒 */}
        {order.paymentMethod === "cod" && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Package className="mt-0.5 h-6 w-6 text-orange-600" />
                <div>
                  <h4 className="mb-2 font-semibold text-orange-900">
                    取貨付款提醒
                  </h4>
                  <p className="text-orange-800">
                    您選擇了取貨付款，請在商品送達時準備現金付款。我們會在商品出貨前與您聯繫確認送貨時間。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 操作按鈕 */}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/orders">
            <Button variant="outline" className="w-full sm:w-auto">
              查看所有訂單
            </Button>
          </Link>
          <Link href="/">
            <Button className="w-full sm:w-auto">繼續購物</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
