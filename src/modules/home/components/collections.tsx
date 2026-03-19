import { Button } from "@/components/ui/button";
import Link from "next/link";
import CollectionCard from "./collection-card";
import { ChevronRight } from "lucide-react";

import { getCollections } from "@/action/collection";

const Collections = async () => {
  const collections = await getCollections();
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col space-y-6 px-3 md:px-5">
      <div className="flex flex-col gap-3">
        <h2 className="ae-home-title">商品系列</h2>
        <span className="ae-home-subTitle">選擇一個喜歡的系列來看看吧!</span>
      </div>
      <div>
        <CollectionCard collections={collections} />
      </div>
      <Button variant="outline" asChild className="block h-25 text-2xl">
        <Link href={`/collections`} className="flex items-center">
          <p>查看更多</p>
          <ChevronRight className="size-12" />
        </Link>
      </Button>
    </section>
  );
};

export default Collections;
