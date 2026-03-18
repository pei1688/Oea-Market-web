"use client";
import { LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { userMenuItems } from "@/lib/config/menu";
import { toast } from "sonner";
import type { auth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Session = typeof auth.$Infer.Session;

const NavbarUser = ({ session }: { session: Session | null }) => {
  const router = useRouter();

  const handleSignOut = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.refresh();
          toast.success("帳戶已登出");
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="none" size="icon" className="size-12">
          {" "}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            strokeWidth="1.5"
            className="size-8 text-neutral-800 hover:text-fuchsia-500"
          >
            <path
              d="M5 20V19C5 15.134 8.13401 12 12 12V12C15.866 12 19 15.134 19 19V20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
            <path
              d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          <span className="sr-only">開啟用戶選單</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {session ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm leading-none font-medium">
                  {session.user.name}
                </p>
                <p className="text-muted-foreground text-xs leading-none">
                  {session.user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {userMenuItems.map((item) => (
                <DropdownMenuItem key={item.label} asChild>
                  <Link
                    href={item.href}
                    className="flex w-full items-center gap-2"
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-fuchsia-500 focus:bg-red-50 focus:text-fuchsia-600"
            >
              <LogOut className="mr-2 size-4" />
              <span>登出</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel>訪客您好</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/sign-in" className="flex w-full items-center gap-2">
                <LogIn className="size-4" />
                <span>登入 / 註冊</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NavbarUser;
