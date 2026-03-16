import { Skeleton } from "@/components/ui/skeleton";

const ProductSkeleton = () => {
  return (
    <div className="grid gap-4 transition-all duration-300 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex aspect-[3/4] flex-col space-y-2">
          <Skeleton className="h-[80%] w-full rounded-t-md bg-neutral-200" />
          <div className="flex flex-col gap-2 p-2">
            <Skeleton className="h-[20px] w-[150px] rounded-md bg-neutral-200" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-[24px] w-[100px] rounded-md bg-neutral-200" />
              <Skeleton className="h-[24px] w-[24px] rounded-md bg-neutral-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductSkeleton;
