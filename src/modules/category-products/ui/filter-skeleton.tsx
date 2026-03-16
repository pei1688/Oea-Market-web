import { Skeleton } from "@/components/ui/skeleton";

const FilterSkeleton = () => {
  return (
    <div className="flex flex-col space-y-6">
      <Skeleton className="h-[24px] w-[40px] rounded-full bg-neutral-200" />
      <Skeleton className="h-[20px] w-[150px] rounded-full bg-neutral-200" />
      <Skeleton className="h-[20px] w-[150px] rounded-full bg-neutral-200" />
    </div>
  );
};

export default FilterSkeleton;
