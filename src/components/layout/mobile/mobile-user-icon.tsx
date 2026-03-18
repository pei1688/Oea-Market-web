"use client";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { auth } from "@/lib/auth";

type Session = typeof auth.$Infer.Session;

const MobileUserIcon = ({ session }: { session: Session | null }) => {
  const router = useRouter();

  const handleUserClick = () => {
    if (session?.user) {
      // 如果已登入，導向個人資料頁面
      router.push("/account/profile");
    } else {
      // 如果未登入，導向登入頁面
      router.push("/sign-in");
    }
  };

  return (
    <Button
      variant="ghost"
      size="none"
      onClick={handleUserClick}
      className="p-2"
    >
      <User className="size-6 hover:text-neutral-600" />
    </Button>
  );
};

export default MobileUserIcon;
