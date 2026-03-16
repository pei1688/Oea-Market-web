// app/api/webhooks/stripe/route.ts (改進版)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook 驗證失敗:", err);
      return NextResponse.json({ error: "Webhook 驗證失敗" }, { status: 400 });
    }

    // 處理付款成功事件
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (!orderId) {
        console.error("資料中未找到 orderId");
        return NextResponse.json({ error: "找不到訂單Id" }, { status: 400 });
      }

      // 使用事務處理付款成功後的操作
      await prisma.$transaction(async (tx) => {
        // 1. 獲取訂單和相關的購物車資訊
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            orderItems: true,
          },
        });

        if (!order) {
          throw new Error(`找不到訂單: ${orderId}`);
        }
        for (const orderItem of order.orderItems) {
          await deductInventory(tx, orderItem);
        }

        // 3. 更新訂單狀態
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            status: "CONFIRMED",
          },
        });
      });

      console.log(`付款成功，訂單 ${orderId} 已確認並扣減庫存`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook 處理失敗:", error);
    return NextResponse.json({ error: "Webhook 處理失敗" }, { status: 500 });
  }
}

// 庫存扣減邏輯
async function deductInventory(tx: any, orderItem: any) {
  if (orderItem.spec2Id) {
    // 從規格2扣庫存
    const spec2 = await tx.productVariantSpec2.findUnique({
      where: { id: orderItem.spec2Id },
    });

    if (!spec2) {
      throw new Error(`找不到商品規格2: ${orderItem.spec2Id}`);
    }

    if (spec2.stock < orderItem.quantity) {
      throw new Error(`商品 ${orderItem.productName} 庫存不足`);
    }

    await tx.productVariantSpec2.update({
      where: { id: orderItem.spec2Id },
      data: {
        stock: {
          decrement: orderItem.quantity,
        },
      },
    });
  } else if (orderItem.variantId) {
    // 從變體扣庫存
    const variant = await tx.productVariant.findUnique({
      where: { id: orderItem.variantId },
    });

    if (!variant) {
      throw new Error(`找不到商品變體: ${orderItem.variantId}`);
    }

    if (variant.stock < orderItem.quantity) {
      throw new Error(`商品 ${orderItem.productName} 庫存不足`);
    }

    await tx.productVariant.update({
      where: { id: orderItem.variantId },
      data: {
        stock: {
          decrement: orderItem.quantity,
        },
      },
    });
  } else {
    // 從主商品扣庫存
    const product = await tx.product.findUnique({
      where: { id: orderItem.productId },
    });

    if (!product) {
      throw new Error(`找不到商品: ${orderItem.productId}`);
    }

    if (product.stock < orderItem.quantity) {
      throw new Error(`商品 ${orderItem.productName} 庫存不足`);
    }

    await tx.product.update({
      where: { id: orderItem.productId },
      data: {
        stock: {
          decrement: orderItem.quantity,
        },
      },
    });
  }
}
