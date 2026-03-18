import Hero from "@/modules/home/components/hero";
import Collections from "@/modules/home/components/collections";
import Brand from "@/modules/home/components/brand";
import { Suspense } from "react";
import ProductList from "@/modules/home/components/product-list";
import { Separator } from "@/components/ui/separator";
import Spinner from "@/components/spinner";
import { getCollections } from "@/action/collection";

const HomePage = async () => {
  const collections = await getCollections();
  return (
    <div className="flex w-full flex-col space-y-12 ">
      <Hero collections={collections}/>
      <Separator className="mx-auto max-w-7xl bg-neutral-500/20" />
      <Suspense fallback={<Spinner />}>
        <Collections collections={collections} />
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
