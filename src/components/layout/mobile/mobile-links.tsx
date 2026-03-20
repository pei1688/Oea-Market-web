import { CollectionWithCategory } from "@/types/collections";
import Link from "next/link";

interface MobileLinksProps {
  collections: CollectionWithCategory[];
  closeSheet: () => void;
}

const MobileLinks = ({ collections, closeSheet }: MobileLinksProps) => {
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
    <div className="flex-1">
      {allNavItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          onClick={closeSheet}
          className="block rounded-lg p-4 px-12 text-lg transition-colors hover:bg-neutral-50"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};

export default MobileLinks;
