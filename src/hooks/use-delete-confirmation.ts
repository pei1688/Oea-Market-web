import { useState } from "react";

export const useDeleteConfirmation = () => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const showDeleteConfirmation = (itemId: string) => {
    setItemToDelete(itemId);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = () => {
    setItemToDelete(null);
    setIsConfirmDialogOpen(false);
  };

  const cancelDelete = () => {
    setItemToDelete(null);
    setIsConfirmDialogOpen(false);
  };

  return {
    isConfirmDialogOpen,
    itemToDelete,
    showDeleteConfirmation,
    confirmDelete,
    cancelDelete,
  };
};
