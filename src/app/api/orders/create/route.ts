import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
      paymentStatus,
      status,
    } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "購物車為空" }, { status: 400 });
    }

    if (!address) {
      return NextResponse.json({ message: "請選擇收貨地址" }, { status: 400 });
    }

    // 使用事務處理訂單創建和庫存扣減
    const result = await prisma.$transaction(async (tx) => {
      // 1. 檢查庫存並準備扣減資料
      const stockUpdates = [];

      for (const item of items) {
        if (item.variantId && item.spec2Id) {
          // 商品有變體且有規格2 - 從 spec2 扣庫存
          const spec2 = await tx.productVariantSpec2.findUnique({
            where: { id: item.spec2Id },
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          });

          if (!spec2) {
            throw new Error(`找不到商品變體規格: ${item.productName}`);
          }

          if (spec2.stock! < item.quantity) {
            throw new Error(`商品 ${item.productName} 庫存不足`);
          }

          stockUpdates.push({
            type: "spec2",
            id: item.spec2Id,
            quantity: item.quantity,
          });
        } else if (item.variantId) {
          // 商品有變體但沒有規格2 - 從變體扣庫存
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            include: {
              product: true,
            },
          });

          if (!variant) {
            throw new Error(`找不到商品變體: ${item.productName}`);
          }

          if (variant.stock! < item.quantity) {
            throw new Error(`商品 ${item.productName} 庫存不足`);
          }

          stockUpdates.push({
            type: "variant",
            id: item.variantId,
            quantity: item.quantity,
          });
        } else {
          // 沒有變體 - 從主商品扣庫存
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`找不到商品: ${item.productName}`);
          }

          if (product.stock < item.quantity) {
            throw new Error(`商品 ${item.productName} 庫存不足`);
          }

          stockUpdates.push({
            type: "product",
            id: item.productId,
            quantity: item.quantity,
          });
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
          paymentStatus,
          status,
          orderItems: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              productImage: item.productImage,
              price: item.price,
              quantity: item.quantity,
              variantText: item.variantText,
              variantId: item.variantId, // 添加變體 ID
              spec2Id: item.spec2Id, // 添加規格2 ID
            })),
          },
        },
        include: {
          orderItems: true,
        },
      });

      // 3. 只有在付款完成時才扣減庫存 (COD訂單創建時不扣庫存)
      if (paymentStatus === "PAID") {
        for (const update of stockUpdates) {
          if (update.type === "spec2") {
            await tx.productVariantSpec2.update({
              where: { id: update.id },
              data: {
                stock: {
                  decrement: update.quantity,
                },
              },
            });
          } else if (update.type === "variant") {
            await tx.productVariant.update({
              where: { id: update.id },
              data: {
                stock: {
                  decrement: update.quantity,
                },
              },
            });
          } else if (update.type === "product") {
            await tx.product.update({
              where: { id: update.id },
              data: {
                stock: {
                  decrement: update.quantity,
                },
              },
            });
          }
        }
      }

      return order;
    });

    return NextResponse.json({
      success: true,
      orderId: result.id,
      message: "訂單創建成功",
    });
  } catch (error) {
    console.error("訂單創建失敗:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "訂單創建失敗",
      },
      { status: 500 },
    );
  }
}
