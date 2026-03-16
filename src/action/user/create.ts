"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAddressSchema } from "@/schema/address/create";
import { headers } from "next/headers";

export const createUserAddress = async (formData: FormData) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user;
  if (!user) {
    return { success: false, message: "找不到使用者，請重新登入" };
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
    await prisma.address.create({
      data: {
        recipientName: safeAddress.recipientName,
        phoneNumber: safeAddress.phoneNumber,
        zipCode: safeAddress.zipCode,
        county: safeAddress.county,
        district: safeAddress.district,
        streetAddress: safeAddress.streetAddress,
        isDefault: safeAddress.isDefault,
        profileId: profile?.id,
      },
    });
    return { success: true, message: "建立地址成功" };
  } catch (error) {
    console.log("建立地址失敗", error);
    return { success: false, message: "建立地址失敗" };
  }
};
