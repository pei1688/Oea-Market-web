"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export const deleteUserAddress = async (formData: FormData) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const user = session?.user;
    if (!user) {
      return { success: false, message: "找不到使用者，請重新登入" };
    }
    const addressId = formData.get("id") as string;
    if (!addressId) {
      return {
        success: false,
        message: "刪除地址失敗",
        error: "MISSING_ADDRESS_ID",
      };
    }

    // 查找要删除的地址
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
      },
    });

    if (!existingAddress) {
      return {
        success: false,
        message: "地址不存在或您沒有權限刪除此地址",
        error: "ADDRESS_NOT_FOUND",
      };
    }

    if (existingAddress.isDefault) {
      return {
        success: false,
        message: "無法刪除預設地址，請先設定其他地址為預設地址",
        error: "CANNOT_DELETE_DEFAULT",
      };
    }

    await prisma.address.delete({
      where: {
        id: addressId,
      },
    });
    revalidatePath("/profile/address");
    revalidatePath("/checkout");

    return {
      success: true,
      message: "地址删除成功",
    };
  } catch (error) {
    console.error("删除地址失败:", error);
    if (error instanceof Error) {
      if (error.message.includes("foreign key constraint")) {
        return {
          success: false,
          message: "無法刪除此地址，該地址可能正在訂單使用",
          error: "FOREIGN_KEY_CONSTRAINT",
        };
      }
      return {
        success: false,
        message: "刪除地址失敗: " + error.message,
        error: "DELETE_ERROR",
      };
    }
    return {
      success: false,
      message: "刪除地址失敗，請稍後重試",
      error: "UNKNOWN_ERROR",
    };
  }
};
