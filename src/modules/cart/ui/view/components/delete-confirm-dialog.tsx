import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmDialog = ({
  isOpen,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) => (
  <Dialog open={isOpen} onOpenChange={onCancel}>
    <DialogContent className="top-[50%] left-[50%] w-[90vw] max-w-md translate-x-[-50%] translate-y-[-50%] rounded-sm bg-neutral-200 p-4">
      <DialogHeader>
        <DialogTitle>確定要刪除這項商品嗎？</DialogTitle>
        <DialogDescription>
          您將從購物車中移除此商品，是否確定？
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col justify-end gap-2 pt-4 sm:flex-row sm:gap-4">
        <Button
          variant="secondary"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          取消
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          className="w-full sm:w-auto"
        >
          確定刪除
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);
