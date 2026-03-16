"use client";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { User } from "better-auth";

const UserSidebar = ({ user }: { user: User }) => {
  const pathName = usePathname();

  return (
    <div className="p-4">
      {/* 使用者資訊 - 響應式設計 */}
      <div className="mb-6 flex items-center md:mb-10 md:flex-col md:items-start">
        <Avatar className="mr-3 size-12 md:mr-0 md:mb-4 md:size-18">
          <AvatarImage
            src={user.image || "https://github.com/shadcn.png"}
            alt="@shadcn"
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div className="md:text-left">
          <h2 className="ae-body">{user.name}</h2>
          <h3 className="ae-caption">{user.email}</h3>
        </div>
      </div>

      {/* 導航選單 - 響應式設計 */}
      <div className="flex space-x-6 overflow-x-auto md:flex-col md:space-y-4 md:space-x-0 md:overflow-visible">
        <Link
          href="/account/profile"
          className={`${
            pathName === "/account/profile"
              ? "border-b-2 border-[#9F2B6D] text-[#9F2B6D] md:border-b-0 md:text-[#9F2B6D]"
              : "hover:text-[#9F2B6D]"
          } ae-body block pb-2 whitespace-nowrap transition md:pb-0 md:whitespace-normal`}
        >
          個人資訊
        </Link>
        <Link
          href="/account/address"
          className={`${
            pathName === "/account/address"
              ? "border-b-2 border-[#9F2B6D] text-[#9F2B6D] md:border-b-0 md:text-[#9F2B6D]"
              : "hover:text-[#9F2B6D]"
          } ae-body block pb-2 whitespace-nowrap transition md:pb-0 md:whitespace-normal`}
        >
          地址
        </Link>
        <Link
          href="/account/order"
          className={`${
            pathName === "/account/order"
              ? "border-b-2 border-[#9F2B6D] text-[#9F2B6D] md:border-b-0 md:text-[#9F2B6D]"
              : "hover:text-[#9F2B6D]"
          } ae-body block pb-2 whitespace-nowrap transition md:pb-0 md:whitespace-normal`}
        >
          訂單
        </Link>
      </div>
    </div>
  );
};

export default UserSidebar;
