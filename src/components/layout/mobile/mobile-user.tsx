"use client";
import { authClient } from "@/lib/auth-client";
import { LogOut, User, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MobileUser = ({
  session,
  closeSheet,
}: {
  session: any;
  closeSheet: () => void;
}) => {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          closeSheet();
          router.push("/"); // 登出後跳轉
        },
      },
    });
  };

  if (!session) {
    return (
      <div className="flex flex-col gap-4">
        <Button asChild className="w-full" onClick={closeSheet}>
          <Link href="/sign-in">登入</Link>
        </Button>
        <Button
          asChild
          variant={"outline"}
          className="w-full border border-fuchsia-800"
          onClick={closeSheet}
        >
          <Link href="/sign-up">註冊</Link>
        </Button>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className="flex flex-col gap-6">
      {/* 用戶資訊簡覽 */}

      <div className="flex flex-col">
        <span className="font-semibold">{user.name}</span>
        <span className="text-xs text-neutral-500">{user.email}</span>
      </div>

      {/* 用戶專屬連結 */}
      <nav className="flex flex-col gap-4">
        <Link
          href="/account/profile"
          onClick={closeSheet}
          className="flex items-center gap-2 py-2 text-sm text-neutral-600 hover:text-black"
        >
          <User size={18} /> 個人檔案
        </Link>
        <Link
          href="/account/order"
          onClick={closeSheet}
          className="flex items-center gap-2 py-2 text-sm text-neutral-600 hover:text-black"
        >
          <ShoppingBag size={18} /> 我的訂單
        </Link>
      </nav>

      <Button
        variant="ghost"
        size={"none"}
        className="justify-start py-2 text-fuchsia-800 hover:text-fuchsia-600"
        onClick={handleSignOut}
        aria-label="登出帳號"
      >
        <LogOut className="mr-2 size-4" /> 登出帳號
      </Button>
    </div>
  );
};

export default MobileUser;
