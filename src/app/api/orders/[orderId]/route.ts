import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    // 獲取當前用戶
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ message: "未授權訪問" }, { status: 401 });
    }

    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { message: "訂單 ID 不能為空" },
        { status: 400 },
      );
    }

    // 查詢訂單，確保只能查看自己的訂單
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id, // 確保用戶只能查看自己的訂單
      },
      include: {
        orderItems: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "找不到訂單或無權限查看" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("獲取訂單失敗:", error);
    return NextResponse.json(
      {
        success: false,
        message: "獲取訂單失敗",
      },
      { status: 500 },
    );
  }
}
