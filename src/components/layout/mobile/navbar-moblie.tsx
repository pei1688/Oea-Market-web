"use client";
import { Menu } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { CollectionWithCategory } from "@/types/collections";
import { Button } from "@/components/ui/button";
import MobileUser from "./mobile-user";
import MobileLinks from "./mobile-links";

const MobileNavMenu = ({
  collections,
}: {
  collections: CollectionWithCategory[];
}) => {
  const { data: session } = authClient.useSession();
  const [sheetOpen, setSheetOpen] = useState(false);

  const closeSheet = () => {
    setSheetOpen(false);
  };
  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="none" className="p-2 lg:hidden">
          <Menu className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="h-screen overflow-hidden border-transparent"
      >
        <div className="mt-12 h-full">
          <div className="flex h-[calc(100vh-80px)] flex-col justify-between pb-10">
            <div>
              <SheetHeader className="hidden">
                <SheetTitle className="text-2xl font-medium">選單</SheetTitle>
              </SheetHeader>

              <MobileLinks collections={collections} closeSheet={closeSheet} />
            </div>
            <div className="border-t border-neutral-200 px-12 pt-8">
              <MobileUser session={session} closeSheet={closeSheet} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavMenu;
