"use client";
import { useAddressStore } from "@/store/address-store";
import { Plus } from "lucide-react";

const AddAddressCard = () => {
  const { openAddDialog } = useAddressStore();

  return (
    <div
      className="flex h-[200px] w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-200/50 transition-colors hover:bg-neutral-200/70"
      onClick={openAddDialog}
    >
      <div className="flex flex-col items-center gap-2">
        <Plus className="size-6 text-neutral-600" />
        <span className="text-neutral-600">新增地址</span>
      </div>
    </div>
  );
};

export default AddAddressCard;
