"use client";
import { LogIn, LogOut, User } from "lucide-react";
import {
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import Link from "next/link";
import { Button } from "../ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { guestMenuItems, userMenuItems } from "@/lib/config/menu";

const MenuItem = ({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) => (
  <NavigationMenuLink asChild className="mt-4 hover:bg-neutral-700/10">
    <Link
      href={href}
      className="flex items-center gap-2 px-2 py-1 text-sm"
      onClick={onClick}
    >
      <Icon className="size-4" />
      <span>{label}</span>
    </Link>
  </NavigationMenuLink>
);

const NavbarUser = () => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const handleSignOut = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.refresh();
        },
      },
    });
  };

  if (isPending) {
    return null;
  }
  return (
    <>
      <NavigationMenuTrigger>
        <User className="size-6 hover:text-neutral-600" />
      </NavigationMenuTrigger>
      <NavigationMenuContent className="bg-background2">
        {session ? (
          <>
            <Label className="flex items-center gap-2 px-2 pt-3">
              <User className="size-4" />
              {session.user.name}
            </Label>
            <Separator className="bg-primary/20 my-4 w-full" />
            <ul className="md:w-[100px] lg:w-[150px]">
              {userMenuItems.map((item) => (
                <li key={item.label}>
                  <MenuItem {...item} />
                </li>
              ))}
              <li>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="ae-body mt-4 flex w-full items-center justify-start gap-2 text-sm hover:bg-neutral-700/10"
                >
                  <LogOut className="size-4" />
                  登出
                </Button>
              </li>
            </ul>
          </>
        ) : (
          <ul className="md:w-[100px] lg:w-[150px]">
            {guestMenuItems.map((item) => (
              <li key={item.label}>
                <MenuItem {...item} />
              </li>
            ))}
            <li>
              <Button
                variant="ghost"
                className="ae-body mt-4 flex w-full items-center justify-start gap-2 text-sm hover:bg-neutral-700/10"
                asChild
              >
                <Link href="/sign-in">
                  <LogIn className="size-4" />
                  請先登入
                </Link>
              </Button>
            </li>
          </ul>
        )}
      </NavigationMenuContent>
    </>
  );
};

export default NavbarUser;
