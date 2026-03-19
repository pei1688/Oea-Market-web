import Hero from "@/modules/home/components/hero";
import Collections from "@/modules/home/components/collections";
import Brand from "@/modules/home/components/brand";
import { Suspense } from "react";
import ProductList from "@/modules/home/components/product-list";
import { Separator } from "@/components/ui/separator";
import Spinner from "@/components/spinner";

export const revalidate = 60;

const HomePage = async () => {
  return (
    <div className="flex w-full flex-col space-y-12">
      <Hero />
      <Separator className="mx-auto max-w-7xl bg-neutral-500/20" />
      <Suspense fallback={<Spinner />}>
        <Collections />
      </Suspense>
      <Separator className="mx-auto max-w-7xl bg-neutral-500/20" />
      <Suspense fallback={<Spinner />}>
        <ProductList />
      </Suspense>
      <Separator className="mx-auto max-w-7xl bg-neutral-500/20" />
      <Brand />
    </div>
  );
};

export default HomePage;
