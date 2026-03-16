"use client";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Input } from "../ui/input";

const NavbarSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const router = useRouter();
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 跳轉到搜尋結果頁面
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsMobileSearchOpen(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
    if (e.key === "Escape") {
      setSearchQuery("");
      setIsMobileSearchOpen(false);
    }
  };

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen(!isMobileSearchOpen);
  };

  // 當手機搜尋欄開啟時，自動聚焦到輸入框
  useEffect(() => {
    if (isMobileSearchOpen && mobileInputRef.current) {
      setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 300); // 等待動畫完成後再聚焦
    }
  }, [isMobileSearchOpen]);

  return (
    <div>
      {/* 搜尋按鈕 */}
      <button
        onClick={toggleMobileSearch}
        className="rounded-md p-2 transition-colors hover:bg-neutral-100"
        aria-label="搜尋"
      >
        <Search className="size-5 text-neutral-800" />
      </button>

      {/* Accordion 式搜尋欄 */}
      <div
        className={`absolute top-16 right-0 left-0 z-50 overflow-hidden border-b border-neutral-200 bg-[#fafafc] shadow-md transition-all duration-300 ease-in-out ${isMobileSearchOpen ? "max-h-20 opacity-100" : "max-h-0 opacity-0"} `}
      >
        <div className="container mx-auto max-w-7xl px-4">
          <div className="py-4">
            <form
              onSubmit={handleSearch}
              className="relative flex items-center"
            >
              <Input
                ref={mobileInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="搜尋商品..."
                className="w-full rounded-full border border-neutral-300 px-4 py-2 pr-20 text-sm transition-all focus:border-fuchsia-500 focus-visible:ring-transparent"
              />
              <div className="absolute right-3 flex items-center gap-2">
                <button
                  type="submit"
                  className="rounded-full bg-transparent p-2 text-neutral-800 transition-colors hover:bg-neutral-100"
                >
                  <Search className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="rounded-full bg-transparent p-2 text-neutral-800 transition-colors hover:bg-neutral-100"
                >
                  <X className="size-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavbarSearch;
