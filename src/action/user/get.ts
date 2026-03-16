"use server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

//驗證是否未登入
export const requireAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/sign-in");
  }

  return session;
};

//驗證是否已登入
export const loginAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    return redirect("/");
  }

  return session;
};

//獲取使用者資料
export const getUserProfile = async () => {
  const session = await requireAuth();

  const profile = await prisma.profile.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      Address: true,
    },
  });

  return profile;
};

//獲取使用者地址
export const getUserAddress = async () => {
  const session = await requireAuth();

  const addresses = await prisma.profile.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      Address: true,
    },
  });

  return addresses?.Address ?? [];
};
