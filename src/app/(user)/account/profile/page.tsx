import { getUserProfile } from "@/action/user/get";
import UserProfileContent from "@/modules/user/ui/views/user-profile-content";

const UserProfilePage = async () => {


  const profile = await getUserProfile();
  if (!profile) {
    return <div>尚未有個人資料</div>;
  }

  return <UserProfileContent profile={profile} />;
};

export default UserProfilePage;
