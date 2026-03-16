"use client";

import CollectionItem from "@/modules/collection/components/collection-item";
import { Collection } from "@prisma/client";

interface CollectionCardProps {
  collections: Collection[];
}

const CollectionCard = ({ collections }: CollectionCardProps) => {
  // 保持篩選邏輯
  const featured = collections.filter((col) =>
    ["AEp選品系列", "新品上市", "日系彩妝", "特價商品"].includes(col.name),
  );

  return (
    <section className="w-full ">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-2 lg:h-150">
        {/* 1. 主打區 (左側佔據 2/4 寬度，全高) */}
        {featured[0] && (
          <div className="group relative overflow-hidden md:col-span-2 md:row-span-2">
            <CollectionItem col={featured[0]} />
          </div>
        )}

        {/* 2. 次要大圖 (右上 2/4 寬度，一半高度) */}
        {featured[1] && (
          <div className="group relative overflow-hidden md:col-span-2 md:row-span-1">
            <CollectionItem col={featured[1]} />
          </div>
        )}

        {/* 3. 中型圖 (右下 1/4 寬度) */}
        {featured[2] && (
          <div className="group relative overflow-hidden md:col-span-1 md:row-span-1">
            <CollectionItem col={featured[2]} />
          </div>
        )}

        {/* 4. 小型圖/文字區 (最右下 1/4 寬度) */}
        {featured[3] && (
          <div className="group relative overflow-hidden md:col-span-1 md:row-span-1">
            <CollectionItem col={featured[3]} />
          </div>
        )}
      </div>
    </section>
  );
};

export default CollectionCard;
