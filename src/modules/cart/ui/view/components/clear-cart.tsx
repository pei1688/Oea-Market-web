import { Button } from "@/components/ui/button";
import Link from "next/link";

export const ClearCart = () => (
  <div className="flex flex-col items-center justify-center gap-4 py-8">
    <span className="ae-cart-title text-center">您的購物車是空的</span>
    <Button asChild>
      <Link href="/">立即前往購物</Link>
    </Button>
  </div>
);
