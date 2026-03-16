"use client";

import Spinner from "@/components/spinner";
import { useSearch } from "@/hooks/use-search";
import ProductItem from "@/modules/product/components/product-item";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const SearchContent = () => {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { results, error, isPending, search } = useSearch();
  const query = searchParams.get("q");
  useEffect(() => {
    if (query) {
      setSearchQuery(query);
      const timeoutId = setTimeout(() => {
        search(query);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [query, search]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold">搜尋結果</h1>
        <p className="text-neutral-600">
          搜尋關鍵字：
          <span className="font-medium"> &quot;{searchQuery}&quot;</span>
        </p>
        {results && (
          <p className="mt-1 text-sm text-neutral-500">
            找到 {results.total} 個結果
          </p>
        )}
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {results && !isPending && (
        <div>
          {results.products.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-lg text-neutral-500">沒有找到相關商品</p>
              <p className="mt-2 text-neutral-400">請嘗試其他關鍵字</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.products.map((product) => (
                <ProductItem key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchContent;
