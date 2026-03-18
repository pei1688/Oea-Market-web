"use client";

import CollectionItem from "@/modules/collection/components/collection-item";
import { CollectionProps } from "@/types/collections";

const CollectionCard = ({ collections }: CollectionProps) => {
  const featured = collections.filter((col) =>
    ["Oea選品", "新品上市", "日系彩妝", "特價商品"].includes(col.name),
  );

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-2 lg:h-150">
        {featured[3] && (
          <div className="group relative overflow-hidden md:col-span-2 md:row-span-2">
            <CollectionItem col={featured[3]} />
          </div>
        )}

        {featured[1] && (
          <div className="group relative overflow-hidden md:col-span-2 md:row-span-1">
            <CollectionItem col={featured[1]} />
          </div>
        )}

        {featured[2] && (
          <div className="group relative overflow-hidden md:col-span-1 md:row-span-1">
            <CollectionItem col={featured[2]} />
          </div>
        )}

        {featured[0] && (
          <div className="group relative overflow-hidden md:col-span-1 md:row-span-1">
            <CollectionItem col={featured[0]} />
          </div>
        )}
      </div>
    </section>
  );
};

export default CollectionCard;
