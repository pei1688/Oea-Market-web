import { Button } from "@/components/ui/button";
import { CollectionWithCategory } from "@/types/collections";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface MobileLinksProps {
  collections: CollectionWithCategory[];
  switchToView: (
    view: "main" | "products" | "special-products" | "new-products",
  ) => void;
  closeSheet: () => void;
}

const MobileLinks = ({
  collections,
  switchToView,
  closeSheet,
}: MobileLinksProps) => {
  const filterCollection = collections.filter(
    (col) => col.name === "新品上市" || col.name === "特價商品",
  );

  const allNavItems = [
    ...filterCollection.map((col) => ({
      href: `/collections/${col.id}/全部`,
      label: col.name,
      hasChild: true,
      action: col.name === "特價商品" ? "special-products" : "new-products",
    })),
    {
      href: "/collections",
      label: "商品系列",
      hasChild: true,
      action: "products",
    },
    {
      href: "/news",
      label: "最新消息",
      hasChild: false,
      action: null,
    },
  ];
  return (
    <div className="flex-1 space-y-1">
      {allNavItems.map((item) =>
        item.hasChild ? (
          <Button
            key={item.label}
            variant="ghost"
            size="sheet"
            onClick={() => switchToView(item.action as any)}
            className="h-auto w-full justify-between py-4"
          >
            <span className="text-lg">{item.label}</span>
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            onClick={closeSheet}
            className="block rounded-lg p-4 px-12 text-lg transition-colors hover:bg-neutral-50"
          >
            {item.label}
          </Link>
        ),
      )}
    </div>
  );
};

export default MobileLinks;
