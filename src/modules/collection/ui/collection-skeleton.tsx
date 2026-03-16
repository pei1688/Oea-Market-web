import { Skeleton } from "@/components/ui/skeleton";

const CollectionSkeleton = () => {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-[410px] w-full rounded-md bg-neutral-200" />
        </div>
      ))}
    </div>
  );
};

export default CollectionSkeleton;
