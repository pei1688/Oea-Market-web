import { requireAuth } from "@/action/user";
import AddressContent from "@/modules/address/ui/view/address-content";


const UserAddressPage = async () => {
  await requireAuth();

  return <AddressContent />;
};

export default UserAddressPage;
