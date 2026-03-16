import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { X } from "lucide-react";
import FilterSection from "./filter-section";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import MobileFilterSkeleton from "../ui/mobile-filter-skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface MobileFiltersProps {
  showMobileFilters: boolean;
  filterParams: {
    categories: string[];
    brands: string[];
    sortBy: string;
  };
  availableFilters: {
    categories: string[];
    brands: string[];
  };
  onClose: () => void;
  onClearFilters: () => void;
  onFilterChange: (
    type: "categories" | "brands",
    value: string,
    checked: boolean,
  ) => void;
  onSortChange: (sortBy: string) => void;
  isPending: boolean;
}

const MobileFilters = ({
  showMobileFilters,
  filterParams,
  availableFilters,
  onClose,
  onClearFilters,
  onFilterChange,
  onSortChange,
  isPending,
}: MobileFiltersProps) => {
  return (
    <Drawer open={showMobileFilters} onOpenChange={onClose} direction="bottom">
      <DrawerContent className="h-full lg:hidden">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle>篩選</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm">
                <X className="size-6" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-4 pb-6">
          {/* 排序選擇器 */}
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger className="ae-sub-section-title">
                排序方式
              </AccordionTrigger>
              <AccordionContent>
                <RadioGroup
                  value={filterParams.sortBy}
                  onValueChange={onSortChange}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="newest" id="newest" />
                    <Label htmlFor="newest">最新上架</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oldest" id="oldest" />
                    <Label htmlFor="oldest">最舊上架</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="price-low" id="price-low" />
                    <Label htmlFor="price-low">價格：低到高</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="price-high" id="price-high" />
                    <Label htmlFor="price-high">價格：高到低</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="name-asc" id="name-asc" />
                    <Label htmlFor="name-asc">名稱：A-Z</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="name-desc" id="name-desc" />
                    <Label htmlFor="name-desc">名稱：Z-A</Label>
                  </div>
                </RadioGroup>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* 分隔線 */}
          <div className="border-t border-neutral-200"></div>

          {/* 清除過濾器按鈕 */}
          {(filterParams.categories.length > 0 ||
            filterParams.brands.length > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClearFilters();
                onClose();
              }}
              className="w-full"
            >
              <X className="mr-2 size-4" />
              清除過濾器
            </Button>
          )}

          {/* 分類過濾 */}
          {isPending ? (
            <MobileFilterSkeleton />
          ) : availableFilters.categories.length > 0 ? (
            <FilterSection
              title="分類"
              items={availableFilters.categories}
              type="categories"
              selectedItems={filterParams.categories}
              onFilterChange={onFilterChange}
            />
          ) : null}

          {/* 品牌過濾 */}
          {isPending ? (
            <MobileFilterSkeleton />
          ) : availableFilters.brands.length > 0 ? (
            <FilterSection
              title="品牌"
              items={availableFilters.brands}
              type="brands"
              selectedItems={filterParams.brands}
              onFilterChange={onFilterChange}
            />
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileFilters;
