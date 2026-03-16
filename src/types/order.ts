import { OrderItem } from "@prisma/client";

export interface Order {
  id: string;
  name: string;
  phoneNumber: string;
  address: string;
  totalItems: number;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  orderItems: OrderItem[];
}
