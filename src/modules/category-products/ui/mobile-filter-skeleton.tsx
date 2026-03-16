import { Skeleton } from "@/components/ui/skeleton";

const MobileFilterSkeleton = () => {
  return (
    <div className="flex flex-col space-y-6">
      <Skeleton className="h-[20px] w-[150px] rounded-full bg-neutral-200" />
      <Skeleton className="h-[20px] w-[100px] rounded-full bg-neutral-200" />
      <Skeleton className="h-[20px] w-[150px] rounded-full bg-neutral-200" />
      <Skeleton className="h-[20px] w-[120px] rounded-full bg-neutral-200" />
      <Skeleton className="h-[20px] w-[150px] rounded-full bg-neutral-200" />
      <Skeleton className="h-[20px] w-[150px] rounded-full bg-neutral-200" />
    </div>
  );
};

export default MobileFilterSkeleton;
