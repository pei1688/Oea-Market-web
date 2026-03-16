import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";

interface ToolbarProps {
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  onShowMobileFilters: () => void;
}

const Toolbar = ({
  sortBy,
  onSortChange,
  onShowMobileFilters,
}: ToolbarProps) => (
  <div className="md:mb-6 flex items-center justify-between">
    {/* 移動端過濾與排序按鈕 */}
    <Button
      variant="outline"
      size="sm"
      onClick={onShowMobileFilters}
      className="lg:hidden w-full my-4"
    >
      <SlidersHorizontal className="mr-2 size-4" />
      篩選
    </Button>

    {/* 桌面版排序選擇器 */}
    <Select value={sortBy} onValueChange={onSortChange}>
      <SelectTrigger className="hidden w-48 lg:flex shadow-transparent">
        <SelectValue placeholder="排序方式" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">最新上架</SelectItem>
        <SelectItem value="price-low">價格：低到高</SelectItem>
        <SelectItem value="price-high">價格：高到低</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

export default Toolbar;
