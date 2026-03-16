"use client";
import { Button } from "@/components/ui/button";
import { useAddressStore } from "@/store/address-store";
import { Edit2, Trash2 } from "lucide-react";

type Address = {
  id: string;
  recipientName: string;
  phoneNumber: string;
  zipCode: string;
  county: string;
  district: string;
  streetAddress: string;
  isDefault: boolean;
};

interface AddressCardProps {
  address: Address;
}

const AddressCard = ({ address }: AddressCardProps) => {
  const { openEditDialog, openDeleteDialog } = useAddressStore();

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEditDialog(address);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDeleteDialog(address);
  };

  return (
    <div className="group ae-caption relative h-[200px] w-full cursor-pointer rounded-lg border bg-neutral-50 p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex h-full flex-col justify-between">
        <div className="space-y-2">
          <h3 className="ae-body">{address.recipientName}</h3>
          <p className="mt-1">{address.phoneNumber}</p>
          <p className="mt-2">
            {address.zipCode} {address.county}
            {address.district}
          </p>
          <p>{address.streetAddress}</p>
        </div>
        {address.isDefault && (
          <span className="ae-small inline-block w-fit rounded-full bg-fuchsia-100 px-2 py-1 text-fuchsia-600">
            預設地址
          </span>
        )}
      </div>

      <div className="absolute top-2 right-2 flex gap-1">
        <Button
          onClick={handleEditClick}
          className="rounded-full bg-sky-700/10 px-3 py-2 shadow-sm transition-colors hover:bg-sky-700/50"
          title="編輯地址"
        >
          <Edit2 className="size-4 text-sky-700" />
        </Button>
        {!address.isDefault && (
          <Button
            onClick={handleDeleteClick}
            className="rounded-full p-1.5 shadow-sm transition-colors"
            title="刪除地址"
            variant={"default"}
          >
            <Trash2 className="size-4 text-neutral-100" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default AddressCard;
