import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { createAddressSchema } from "@/schema/address/create";
import {
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
} from "@/action/user";
import { useAddressStore } from "@/store/address-store";

export const useAddressActions = () => {
  const queryClient = useQueryClient();
  const { editingAddress, deletingAddress, closeDialog, closeDeleteDialog } =
    useAddressStore();
  // 重新抓取數據 - 只需要 invalidate，React Query 會自動重新獲取
  const invalidateQueries = async () => {
    await queryClient.invalidateQueries({ 
      queryKey: ["addresses"],
      refetchType: "active" // 只重新獲取當前活躍的查詢
    });
  };
  // 新增地址
  const addMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createAddressSchema>) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      return createUserAddress(formData);
    },
    onSuccess: async (response) => {
      if (response.success) {
        toast.success(response.message);
        await invalidateQueries();
        closeDialog();
      } else {
        toast.error(response.message || "新增地址失敗");
      }
    },
    onError: (error) => {
      console.error("新增地址失敗:", error);
      toast.error("新增地址失敗");
    },
  });

  // 更新地址
  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createAddressSchema>) => {
      if (!editingAddress) throw new Error("沒有選擇要編輯的地址");

      const formData = new FormData();
      formData.append("id", editingAddress.id);
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      return updateUserAddress(formData);
    },
    onSuccess: async (response) => {
      if (response.success) {
        toast.success(response.message);
        await invalidateQueries();
        closeDialog();
      } else {
        toast.error(response.message || "更新地址失敗");
      }
    },
    onError: (error) => {
      console.error("更新地址失敗:", error);
      toast.error("更新地址失敗");
    },
  });

  // 刪除地址
  const deleteMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const formData = new FormData();
      formData.append("id", addressId);
      return deleteUserAddress(formData);
    },
    onSuccess: async (response) => {
      if (response.success) {
        toast.success(response.message);
        await invalidateQueries();
        closeDeleteDialog();
      } else {
        toast.error(response.message || "刪除地址失敗");
      }
    },
    onError: (error) => {
      console.error("刪除地址失敗:", error);
      toast.error("刪除地址失敗");
    },
  });

  // 處理函數
  const handleAdd = (data: z.infer<typeof createAddressSchema>) => {
    addMutation.mutate(data);
  };

  const handleUpdate = (data: z.infer<typeof createAddressSchema>) => {
    updateMutation.mutate(data);
  };

  const handleDelete = () => {
    if (!deletingAddress) return;
    deleteMutation.mutate(deletingAddress.id);
  };

  const handleSubmit = editingAddress ? handleUpdate : handleAdd;

  return {
    handleAdd,
    handleUpdate,
    handleDelete,
    handleSubmit,
    // 暴露 mutation 狀態供組件使用
    isAddPending: addMutation.isPending,
    isUpdatePending: updateMutation.isPending,
    isDeletePending: deleteMutation.isPending,
    // 組合的 pending 狀態
    isPending: addMutation.isPending || updateMutation.isPending,
  };
};
