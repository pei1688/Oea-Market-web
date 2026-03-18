import { type Metadata } from "next";
import { getUserProfile } from "@/action/user/get";
import CheckOutContent from "@/modules/checkout/ui/views/check-out-content";

export const metadata: Metadata = {
  robots: { index: false },
};

const CheckOutPage = async () => {
  const profile = await getUserProfile();
  if (!profile) {
    return <div>尚未有個人資料</div>;
  }

  return <CheckOutContent profile={profile} />;
};

export default CheckOutPage;
