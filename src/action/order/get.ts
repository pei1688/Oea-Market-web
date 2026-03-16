"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "../user";

export const getOrders = async () => {
  const session = await requireAuth();

  const orders = await prisma.order.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      paymentMethod: true,
      orderItems: true,
      paymentStatus: true,
      status: true,
    },
  });
  return orders;
};

export const getOrderById = async (orderId: string) => {
  const session = await requireAuth();

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    select: {
      id: true,
      paymentMethod: true,
      orderItems: true,
      paymentStatus: true,
      status: true,
      address: true,
      phoneNumber: true,
      name: true,
    },
  });
  return order;
};
