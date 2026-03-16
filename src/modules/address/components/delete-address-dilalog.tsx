"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAddressActions } from "@/hooks/use-address-actions";
import { useAddressStore } from "@/store/address-store";

const DeleteAddressDialog = () => {
  const { deleteDialogOpen, deletingAddress, closeDeleteDialog } =
    useAddressStore();
  const { handleDelete, isDeletePending } = useAddressActions();

  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={closeDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確認刪除地址</AlertDialogTitle>
          <AlertDialogDescription>
            您確定要刪除「{deletingAddress?.recipientName}」的收貨地址嗎？
            <br />
            <span className="text-sm text-neutral-500">
              {deletingAddress?.county}
              {deletingAddress?.district} {deletingAddress?.streetAddress}
            </span>
            <br />
            此操作無法復原。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={closeDeleteDialog}
            disabled={isDeletePending}
          >
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeletePending}
            className="bg-destructive hover:bg-destructive/80 text-neutral-50"
          >
            {isDeletePending ? "刪除中..." : "確認刪除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAddressDialog;
