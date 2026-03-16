import { getUserProfile } from "@/action/user/get";
import CheckOutContent from "@/modules/checkout/ui/views/check-out-content";


const CheckOutPage = async () => {
  const profile = await getUserProfile();
  if (!profile) {
    return <div>尚未有個人資料</div>;
  }

  return <CheckOutContent profile={profile} />;
};

export default CheckOutPage;
