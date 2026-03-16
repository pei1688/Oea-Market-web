"use client";
import { Separator } from "@/components/ui/separator";
import { Profile } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/action/user";
import Spinner from "@/components/spinner";
import dynamic from "next/dynamic";

export interface UserProfileProps {
  profile: Profile | null;
}
const UpdateUserForm = dynamic(
  () => import("../../components/update-user-form"),
  {
    loading: () => <Spinner />,
    ssr: false,
  },
);
const UserProfileContent = ({ profile }: UserProfileProps) => {
  const { data: profileData, isPending } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => getUserProfile(),
    initialData: profile,
  });

  if (isPending) {
    return <Spinner />;
  }

  return (
    <>
      <h1 className="ae-home-title mb-4">個人資訊</h1>
      <div className="ae-caption">管理關於登入帳號，使用者資料的設定</div>
      <Separator className="bg-primary/20 mx-auto mt-8 max-w-7xl" />
      {/*會員資料*/}
      <UpdateUserForm profile={profileData} />
    </>
  );
};

export default UserProfileContent;
