import Link from "next/link";
import Image from "next/image";
import { Collection } from "@prisma/client";
import { Button } from "@/components/ui/button";

interface CollectionItemProps {
  col: Collection;
}

const CollectionItem = ({ col }: CollectionItemProps) => {
  const defaultSlug = encodeURIComponent("全部");

  return (
    <Link
      href={`/collections/${col.id}/${defaultSlug}`}
      className="relative block aspect-video w-full shadow-xl duration-500 hover:scale-102 hover:shadow-2xl lg:h-full"
    >
      <Image
        src={col.image || "/default-collection.jpg"}
        alt={col.name}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
        className="rounded-sm object-cover transition-transform"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+ZNPQAIXwM4ihSTfQAAAABJRU5ErkJggg=="
        quality={60}
        priority
      />
      <div className="absolute inset-0 z-10 rounded-sm bg-linear-to-t from-neutral-800/80 via-neutral-800/20 to-transparent transition-opacity duration-500 group-hover:from-neutral-800/90" />
      <div className="absolute inset-0 flex w-full flex-col items-center justify-center gap-4 px-4 py-3 text-neutral-50">
        <h1 className="ae-home-title">{col.name}</h1>
        <Button variant={"default2"}>查看商品</Button>
      </div>
    </Link>
  );
};

export default CollectionItem;
