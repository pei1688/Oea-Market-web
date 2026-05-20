import Hero from "@/modules/home/components/hero";
import Collections from "@/modules/home/components/collections";
import Brand from "@/modules/home/components/brand";
import { Suspense } from "react";
import ProductList from "@/modules/home/components/product-list";
import Spinner from "@/components/spinner";

export const revalidate = 60;

const HomePage = async () => {
  return (
    <div className="flex w-full flex-col space-y-30">
      <Hero />
      <Suspense fallback={<Spinner />}>
        <Collections />
      </Suspense>
      <Suspense fallback={<Spinner />}>
        <ProductList />
      </Suspense>
      <Brand />
    </div>
  );
};

export default HomePage;
