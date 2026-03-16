import { Button } from "@/components/ui/button";
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getCategoriesFromCollection } from "@/lib/category";
import { CollectionWithCategory } from "@/types/collections";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface MobileSaleProductsProps {
  backToMain: () => void;
  closeSheet: () => void;
  collections: CollectionWithCategory[];
}

const MobileSaleProducts = ({
  backToMain,
  closeSheet,
  collections,
}: MobileSaleProductsProps) => {
  const specialProductCategories = getCategoriesFromCollection(
    collections,
    "特價商品",
  );
  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sheet"
            onClick={backToMain}
            className="-ml-1 p-1"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <SheetTitle>特價商品</SheetTitle>
        </div>
        <SheetDescription className="px-8">選擇特價商品的分類</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {/* 顯示全部選項 */}
        <Link
          href={`/collections/${collections.find((col) => col.name === "特價商品")?.id}/全部`}
          onClick={closeSheet}
          className="block rounded-lg px-12 text-lg font-medium transition-colors"
        >
          全部
        </Link>

        {/* 顯示該集合下的商品分類 */}
        {specialProductCategories ? (
          specialProductCategories.map((category) => (
            <Link
              key={category.id}
              href={`/collections/${collections.find((col) => col.name === "特價商品")?.id}/${category.name}`}
              onClick={closeSheet}
              className="block rounded-lg px-12 text-lg font-medium transition-colors"
            >
              {category.name}
            </Link>
          ))
        ) : (
          <div className="text-neutral-100">尚無商品</div>
        )}
      </div>
    </>
  );
};

export default MobileSaleProducts;
