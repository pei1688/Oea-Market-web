"use client";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { useCartStore } from "@/store/cart-store";
import { useRouter } from "next/navigation";
import CartTable from "./components/cart-table";
import CartHeader from "./components/cart-header";
import { ClearCart } from "./components/clear-cart";
import { CartInfo } from "./components/cart-info";
import { useDeleteConfirmation } from "@/hooks/use-delete-confirmation";
import { useCartSelection } from "@/hooks/use-cart-selection";
import { DeleteConfirmDialog } from "./components/delete-confirm-dialog";
const CartContent = () => {
  const { data: user } = authClient.useSession();
  const { items, updateQuantity, removeItem, setCheckoutItems } =
    useCartStore();
  const router = useRouter();
  const {
    selectedItems,
    selectedItemsData,
    handleItemSelect,
    handleSelectAll,
    removeFromSelection,
  } = useCartSelection(items);

  const {
    isConfirmDialogOpen,
    itemToDelete,
    showDeleteConfirmation,
    confirmDelete: handleConfirmDelete,
    cancelDelete,
  } = useDeleteConfirmation();

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      showDeleteConfirmation(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeItem(itemToDelete);
      removeFromSelection(itemToDelete);
    }
    handleConfirmDelete();
  };

  const handleCheckout = () => {
    setCheckoutItems(selectedItemsData.items);
    router.push("/checkout");
  };

  if (items.length === 0) {
    return <ClearCart />;
  }

  return (
    <div className="p-6 md:p-0">
      <CartHeader totalPrice={selectedItemsData.totalPrice} />
      {items.length === 0 ? (
        <ClearCart />
      ) : (
        <div className="flex flex-col gap-4">
          <CartTable
            items={items}
            selectedItems={selectedItems}
            handleSelectAll={handleSelectAll}
            handleItemSelect={handleItemSelect}
            handleQuantityChange={handleQuantityChange}
            removeItem={removeItem}
          />
          <Separator className="bg-primary/20 mx-auto mt-8 max-w-7xl" />

          {items.length > 0 && (
            <CartInfo
              selectedCount={selectedItems.size}
              selectedItemsData={selectedItemsData}
              user={user}
              onCheckout={handleCheckout}
            />
          )}
        </div>
      )}
      <DeleteConfirmDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default CartContent;
