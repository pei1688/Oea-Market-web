"use client";

import { Menu } from "lucide-react";
import { useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { CollectionWithCategory } from "@/types/collections";
import { Button } from "@/components/ui/button";
import MobileUser from "./mobile-user";
import MobileSaleProducts from "./mobile-sale-products";
import MoblieNewProducts from "./moblie-new-products";
import MobileLinks from "./mobile-links";
import MobileCollections from "./mobile-collections";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

const MobileNavMenu = ({
  collections,
}: {
  collections: CollectionWithCategory[];
}) => {
  const { data: session } = authClient.useSession();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentView, setCurrentView] = useState<
    "main" | "products" | "special-products" | "new-products"
  >("main");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const sheetContentRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (sheetOpen && sheetContentRef.current && contentRef.current) {
      gsap.set(sheetContentRef.current, {
        opacity: 0,
      });

      gsap.set(contentRef.current, {
        opacity: 0,
      });

      // 創建漸變顯現效果
      const tl = gsap.timeline();

      // 整個 Sheet 平滑淡入
      tl.to(sheetContentRef.current, {
        opacity: 1,
        duration: 0.4,
        ease: "power2.inOut",
      });
    }
  }, [sheetOpen]);

  // 視圖切換動畫 - 平滑過渡
  useGSAP(() => {
    if (isTransitioning && contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 0,
        duration: 0.15,
        ease: "power2.out",
        onComplete: () => {
          // 動畫完成後平滑恢復
          gsap.to(contentRef.current, {
            opacity: 1,
            duration: 0.15,
            ease: "power2.inOut",
          });
        },
      });
    }
  }, [isTransitioning]);

  const closeSheet = () => {
    setSheetOpen(false);
    setTimeout(() => setCurrentView("main"), 200);
  };

  const openSheet = () => {
    setCurrentView("main");
    setSheetOpen(true);
  };

  const switchToView = (
    view: "main" | "products" | "special-products" | "new-products",
  ) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView(view);
      setIsTransitioning(false);
    }, 150);
  };

  const backToMain = () => {
    switchToView("main");
  };

  return (
    <>
      {/* Trigger */}
      <Button
        variant="ghost"
        size="none"
        onClick={openSheet}
        className="p-2 lg:hidden"
      >
        <Menu className="size-6" />
      </Button>

      {/* 單一 Sheet 容器 */}
      <Sheet open={sheetOpen} onOpenChange={closeSheet}>
        <SheetContent
          side="top"
          className="h-screen w-[100%] overflow-hidden"
          ref={sheetContentRef}
        >
          <div ref={contentRef} className="h-full">
            {/* 主選單內容 */}
            {currentView === "main" && (
              <div className="mt-16 flex flex-col">
                <SheetHeader className="px-12">
                  <SheetTitle>選單</SheetTitle>
                </SheetHeader>

                {/* 導航項目 */}
                <MobileLinks
                  collections={collections}
                  switchToView={switchToView}
                  closeSheet={closeSheet}
                />

                {/* 用戶區域 */}
                <MobileUser
                  closeSheet={closeSheet}
                  session={session}
                  authClient={authClient}
                />
              </div>
            )}

            {/* 商品系列內容 */}
            {currentView === "products" && (
              <MobileCollections
                closeSheet={closeSheet}
                collections={collections}
                backToMain={backToMain}
              />
            )}

            {/* 特價商品分類內容 */}
            {currentView === "special-products" && (
              <MobileSaleProducts
                closeSheet={closeSheet}
                collections={collections}
                backToMain={backToMain}
              />
            )}

            {/* 本週新品分類內容 */}
            {currentView === "new-products" && (
              <MoblieNewProducts
                backToMain={backToMain}
                closeSheet={closeSheet}
                collections={collections}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileNavMenu;
