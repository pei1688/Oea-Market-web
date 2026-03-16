import { create } from "zustand";

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

interface AddressState {
  dialogOpen: boolean;
  deleteDialogOpen: boolean;
  editingAddress: Address | null;
  deletingAddress: Address | null;

  openAddDialog: () => void;
  openEditDialog: (address: Address) => void;
  openDeleteDialog: (address: Address) => void;
  closeDialog: () => void;
  closeDeleteDialog: () => void;
  reset: () => void;
}

export const useAddressStore = create<AddressState>((set) => ({
  dialogOpen: false,
  deleteDialogOpen: false,
  editingAddress: null,
  deletingAddress: null,

  openAddDialog: () => set({ dialogOpen: true, editingAddress: null }),
  openEditDialog: (address) =>
    set({ dialogOpen: true, editingAddress: address }),
  openDeleteDialog: (address) =>
    set({ deleteDialogOpen: true, deletingAddress: address }),
  closeDialog: () => set({ dialogOpen: false, editingAddress: null }),
  closeDeleteDialog: () =>
    set({ deleteDialogOpen: false, deletingAddress: null }),
  reset: () =>
    set({
      dialogOpen: false,
      deleteDialogOpen: false,
      editingAddress: null,
      deletingAddress: null,
    }),
}));
