import { Button } from "@/components/ui/button";
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CollectionWithCategory } from "@/types/collections";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface MobileCollectionsProps {
  backToMain: () => void;
  collections: CollectionWithCategory[];
  closeSheet: () => void;
}

const MobileCollections = ({
  backToMain,
  collections,
  closeSheet,
}: MobileCollectionsProps) => {
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
          <SheetTitle>商品系列</SheetTitle>
        </div>
        <SheetDescription className="px-8">
          選擇你想瀏覽的商品分類
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {collections.map((col) => (
          <Link
            key={col.id}
            href={`/collections/${col.id}/全部`}
            onClick={closeSheet}
            className="block rounded-lg px-12 text-lg font-medium transition-colors hover:bg-neutral-50"
          >
            {col.name}
          </Link>
        ))}
      </div>
    </>
  );
};

export default MobileCollections;
