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
      <div className="absolute inset-0 z-10 rounded-sm bg-linear-to-t from-fuchsia-800/40 via-fuchsia-800/20 to-transparent transition-opacity duration-500 group-hover:from-fuchsia-800/60" />
      <div className="absolute inset-0 z-30 flex w-full flex-col items-center justify-center gap-6 px-4 py-3 text-neutral-100">
        <h3 className="ae-home-title font-medium">{col.name}</h3>
      </div>
    </Link>
  );
};

export default CollectionItem;
