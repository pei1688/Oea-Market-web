"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddressStore } from "@/store/address-store";
import AddressForm from "./address-form";
import { useAddressActions } from "@/hooks/use-address-actions";

const AddressFormDialog = () => {
  const { dialogOpen, editingAddress, closeDialog } = useAddressStore();
  const { handleSubmit, isPending } = useAddressActions();

  return (
    <Dialog open={dialogOpen} onOpenChange={closeDialog}>
      <DialogContent className="top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-sm bg-neutral-200 p-4">
        <DialogHeader>
          <DialogTitle>
            {editingAddress ? "編輯收貨地址" : "新增收貨地址"}
          </DialogTitle>
        </DialogHeader>
        <AddressForm
          onSubmit={handleSubmit}
          onCancel={closeDialog}
          pending={isPending}
          initialData={editingAddress}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddressFormDialog;
