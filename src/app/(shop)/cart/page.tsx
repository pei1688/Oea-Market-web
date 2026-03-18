import { type Metadata } from "next";
import CartContent from "@/modules/cart/ui/view/cart-content";

export const metadata: Metadata = {
  robots: { index: false },
};

const CartPage = () => {
  return <CartContent />;
};

export default CartPage;
