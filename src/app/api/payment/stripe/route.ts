import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(request: NextRequest) {
  try {
    // 獲取當前用戶
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ message: "未授權訪問" }, { status: 401 });
    }

    const {
      items,
      totalItems,
      totalPrice,
      address,
      paymentMethod,
    } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "購物車為空" }, { status: 400 });
    }

    if (!address) {
      return NextResponse.json({ message: "請選擇收貨地址" }, { status: 400 });
    }

    // 使用事務處理
    const result = await prisma.$transaction(async (tx) => {
      // 1. 檢查庫存
      for (const item of items) {
        if (item.variantId && item.spec2Id) {
          // 商品有變體且有規格2
          const spec2 = await tx.productVariantSpec2.findUnique({
            where: { id: item.spec2Id },
          });

          if (!spec2 || spec2.stock! < item.quantity) {
            throw new Error(`商品 ${item.productName} 庫存不足`);
          }
        } else if (item.variantId) {
          // 商品有變體但沒有規格2
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (!variant || variant.stock! < item.quantity) {
            throw new Error(`商品 ${item.productName} 庫存不足`);
          }
        } else {
          // 沒有變體
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product || product.stock < item.quantity) {
            throw new Error(`商品 ${item.productName} 庫存不足`);
          }
        }
      }

      // 2. 創建訂單
      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          name: address.recipientName,
          phoneNumber: address.phoneNumber,
          address: `${address.zipCode} ${address.county}${address.district}${address.streetAddress}`,
          totalItems,
          totalPrice,
          paymentMethod,
          paymentStatus: "PENDING",
          status: "PENDING_PAYMENT",
          orderItems: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              productImage: item.productImage,
              price: item.price,
              quantity: item.quantity,
              variantText: item.variantText,
              variantId: item.variantId,
              spec2Id: item.spec2Id,
            })),
          },
        },
      });

      // 3. 創建 Stripe 付款 Session
      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: items.map((item: any) => ({
          price_data: {
            currency: "twd",
            product_data: {
              name: item.productName,
              images: [item.productImage],
              description: item.variantText || undefined,
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        })),
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_URL}/account/order/success?session_id={CHECKOUT_SESSION_ID}&orderId=${order.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/account/order?cancelled=true`,
        metadata: {
          orderId: order.id,
          userId: session.user.id,
        },
        customer_email: session.user.email,
      
      });

      // 4. 更新訂單，添加 Stripe Session ID
      await tx.order.update({
        where: { id: order.id },
        data: {
          stripeSessionId: stripeSession.id,
        },
      });

      return {
        orderId: order.id,
        sessionUrl: stripeSession.url,
      };
    });

    return NextResponse.json({
      success: true,
      sessionUrl: result.sessionUrl,
      orderId: result.orderId,
    });
  } catch (error) {
    console.error("付款處理失敗:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "付款處理失敗",
      },
      { status: 500 },
    );
  }
}
