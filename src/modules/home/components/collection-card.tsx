"use client";
import CollectionItem from "@/modules/collection/components/collection-item";
import { CollectionProps } from "@/types/collections";

const CollectionCard = ({ collections }: CollectionProps) => {
  const featured = collections.filter((col) =>
    ["Oea選品", "新品上市", "日系彩妝", "特價商品"].includes(col.name),
  );

  return (
    <section className="w-full">
      {/* 設定 md 為 4 欄 2 列，高度固定或自適應 */}
      <div className="grid grid-cols-1 gap-4 md:h-full md:grid-cols-4 md:grid-rows-2 lg:h-150">
        {/* 左側大圖：佔據 2 欄 2 列 (2x2) */}
        {featured[3] && (
          <div className="group relative overflow-hidden md:col-span-2 md:row-span-2">
            <CollectionItem col={featured[3]} />
          </div>
        )}

        {/* 右上長圖：佔據剩下的 2 欄寬度，1 列高度 */}
        {featured[1] && (
          <div className="group relative overflow-hidden md:col-span-2 md:row-span-1">
            <CollectionItem col={featured[1]} />
          </div>
        )}

        {/* 右下小圖 A：1 欄 1 列 */}
        {featured[2] && (
          <div className="group relative overflow-hidden md:col-span-1 md:row-span-1">
            <CollectionItem col={featured[2]} />
          </div>
        )}

        {/* 右下小圖 B：1 欄 1 列 */}
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
