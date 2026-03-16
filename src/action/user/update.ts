"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAddressSchema } from "@/schema/address/create";
import { updateUserActionSchema } from "@/schema/user";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export const updateUser = async (formData: FormData) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user;
  if (!user) {
    return { success: false, message: "找不到使用者，請重新登入" };
  }

  const data = {
    name: formData.get("name") || undefined,
    phoneNumber: formData.get("phoneNumber") || undefined,
    gender: formData.get("gender") || undefined,
    birthday: formData.get("birthday") || undefined,
  };
  const safeUser = updateUserActionSchema.parse(data);

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      name: safeUser.name,
      phoneNumber: safeUser.phoneNumber,
      gender: safeUser.gender,
      birthday: safeUser.birthday ? new Date(safeUser.birthday) : undefined,
    },
  });
  revalidatePath("/account/profile");
  return { success: true, message: "個人資訊更新成功！" };
};

export const updateUserAddress = async (formData: FormData) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user;
  if (!user) {
    return { success: false, message: "找不到使用者，請重新登入" };
  }

  const addressId = formData.get("id") as string;
  if (!addressId) {
    return { success: false, message: "找不到地址 ID" };
  }

  const profile = await prisma.profile.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!profile) {
    return { success: false, message: "找不到使用者的 Profile" };
  }

  // 驗證地址是否屬於當前用戶
  const existingAddress = await prisma.address.findFirst({
    where: {
      id: addressId,
      profileId: profile.id,
    },
  });

  if (!existingAddress) {
    return { success: false, message: "找不到指定的地址或無權限修改" };
  }

  const data = {
    recipientName: formData.get("recipientName"),
    phoneNumber: formData.get("phoneNumber"),
    zipCode: formData.get("zipCode"),
    county: formData.get("county"),
    district: formData.get("district"),
    streetAddress: formData.get("streetAddress"),
    isDefault: formData.get("isDefault") === "true",
  };

  const safeAddress = createAddressSchema.parse(data);

  try {
    // 如果設為預設地址，先將其他地址的預設狀態取消
    if (safeAddress.isDefault) {
      await prisma.address.updateMany({
        where: {
          profileId: profile.id,
          id: { not: addressId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    await prisma.address.update({
      where: {
        id: addressId,
      },
      data: {
        recipientName: safeAddress.recipientName,
        phoneNumber: safeAddress.phoneNumber,
        zipCode: safeAddress.zipCode,
        county: safeAddress.county,
        district: safeAddress.district,
        streetAddress: safeAddress.streetAddress,
        isDefault: safeAddress.isDefault,
      },
    });
    revalidatePath("/account/address");
    return { success: true, message: "更新地址成功" };
  } catch (error) {
    console.log("更新地址失敗", error);
    return { success: false, message: "更新地址失敗" };
  }
};
