import { getCollections } from "@/action/collection";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CollectionCard from "./collection-card";
import { ChevronDown } from "lucide-react";

const Collections = async () => {
  const collections = await getCollections();

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col space-y-6 px-6">
      <div className="flex flex-col gap-3">
        <h3 className="ae-home-title">商品系列</h3>
        <span className="ae-home-subTitle">選擇一個喜歡的系列來看看吧!</span>
      </div>
      <div>
        <CollectionCard collections={collections} />
      </div>
      <Button variant="outline" asChild className="block h-25 text-2xl">
        <Link href={`/collections`} className="flex items-center">
          <p>View more</p>
          <ChevronDown className="size-12 text-neutral-500" />
        </Link>
      </Button>
    </section>
  );
};

export default Collections;
