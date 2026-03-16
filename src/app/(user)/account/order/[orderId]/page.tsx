import OrderIdContent from "@/modules/order/ui/views/orderId-content";

interface OrderPageProps {
  params: Promise<{ orderId: string }>;
}

const OrderPage = async ({ params }: OrderPageProps) => {
  const { orderId } = await params;

  return <OrderIdContent orderId={orderId} />;
};

export default OrderPage;
