import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import NavbarUser from "./navbar-user";
import NavbarCart from "./navbar-cart";
import MobileNavMenu from "./mobile/navbar-moblie";
import { CollectionWithCategory } from "@/types/collections";
import NavbarSearch from "./navbar-search";
import MobileCart from "./mobile/mobile-cart";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface NavLinksProps {
  collections: CollectionWithCategory[];
}

export const NavLinks = async ({ collections }: NavLinksProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const filterCollection = collections.filter(
    (col) => col.name === "新品上市" || col.name === "特價商品",
  );

  return (
    <>
      {/* 桌面版導航 */}
      <div className="hidden lg:flex lg:w-full lg:items-center lg:justify-between">
        {/* 左邊佔位 - 保持平衡 */}
        <div className="flex-1"></div>

        {/* 中間的導航連結 */}
        <nav className="ae-caption flex items-center gap-8">
          {filterCollection?.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.id}/全部`}
              className="inline-flex h-9 py-2 transition-all hover:text-neutral-800"
            >
              {col.name}
            </Link>
          ))}
          <Link
            href={"/collections"}
            className="h-9 py-2 transition-all hover:text-neutral-800"
          >
            商品系列
          </Link>
          <Link
            href={"/news"}
            className="h-9 py-2 transition-all hover:text-neutral-800"
          >
            最新消息
          </Link>
        </nav>

        {/* 右邊的功能區域 */}
        <div className="flex flex-1 items-center justify-end gap-4">
          <NavbarSearch />

          <NavigationMenu>
            <NavigationMenuList className="gap-4">
              <NavbarCart />
              {session ? (
                <NavigationMenuItem>
                  <NavbarUser session={session} />
                </NavigationMenuItem>
              ) : (
                <div className="flex gap-3">
                  <Link
                    href="/sign-in"
                    className="ae-caption inline-flex items-center justify-center rounded-md bg-fuchsia-600 px-4 py-1 text-neutral-100 transition-opacity hover:opacity-80"
                  >
                    登入
                  </Link>
                  <Link
                    href="/sign-up"
                    className="ae-caption inline-flex items-center justify-center rounded-md border border-fuchsia-600 px-4 py-1 text-fuchsia-800 transition-opacity hover:opacity-80"
                  >
                    註冊
                  </Link>
                </div>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>

      {/* 中等螢幕和手機版 */}
      <div className="flex w-full items-center justify-end gap-4 lg:hidden">
        {/* 中等螢幕顯示搜尋和購物車 */}
        <div className="hidden md:flex md:items-center md:gap-4">
          <NavbarSearch />
          <NavigationMenu>
            <NavigationMenuList className="gap-3">
              <NavigationMenuItem>
                <NavbarUser session={session} />
              </NavigationMenuItem>
              <NavbarCart />
            </NavigationMenuList>
          </NavigationMenu>
          <MobileNavMenu collections={collections} />
        </div>

        {/* 手機版顯示搜尋、購物車、用戶和選單按鈕 */}
        <div className="flex items-center md:hidden">
          <NavbarSearch />
          <MobileCart />
          <MobileNavMenu collections={collections} />
        </div>
      </div>
    </>
  );
};
