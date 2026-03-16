import { Button } from "@/components/ui/button";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { userMenuItems } from "@/lib/config/menu";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthClient, SessionWithUser } from "@/types/user";

interface MobileUserProps {
  closeSheet: () => void;
  session: SessionWithUser | null;
  authClient: AuthClient;
}

const MobileUser = ({ session, closeSheet, authClient }: MobileUserProps) => {
  const router = useRouter();

  const handleSignOut = () => {
    if (session?.user) {
      authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.refresh();
          },
        },
      });
    } else {
      router.push("/sign-in");
      closeSheet();
    }
  };
  return (
    <div className="mt-8">
      <SheetHeader className="px-12">
        <SheetTitle>個人資訊</SheetTitle>
      </SheetHeader>
      <div className="space-y-1">
        {userMenuItems.map((item) => (
          <Link
            key={item.label}
            href={session ? item.href : "/sign-in"}
            onClick={closeSheet}
            className="flex items-center gap-3 rounded-lg px-12 py-4 transition-colors hover:bg-neutral-50"
          >
            <item.icon className="size-4" />
            <span className="text-lg">{item.label}</span>
          </Link>
        ))}

        <Button
          variant="ghost"
          onClick={handleSignOut}
          size={"sheet"}
          className="w-full justify-start gap-3"
        >
          <LogOut className="size-4" />
          <span className="text-lg font-normal">
            {session ? "登出" : "登入"}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default MobileUser;
