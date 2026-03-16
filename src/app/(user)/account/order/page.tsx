import { requireAuth } from "@/action/user";
import OrderContent from "@/modules/order/ui/views/order-content";

const OdersPage = async () => {
  await requireAuth();

  return <OrderContent />;
};

export default OdersPage;
