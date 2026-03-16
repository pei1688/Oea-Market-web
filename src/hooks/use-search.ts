"use client";

import { getProductFormSearch, searchResult } from "@/action/search/get";
import { useCallback, useState, useTransition } from "react";

export const useSearch = () => {
  const [results, setResults] = useState<searchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const search = useCallback((query: string) => {
    if (!query || query.trim() === "") {
      setResults(null);
      return;
    }
    startTransition(async () => {
      try {
        setError(null);
        const data = await getProductFormSearch({ query });
        setResults(data);
      } catch (err) {
        setError("搜尋時發生錯誤");
        setResults(null);
      }
    });
  }, []);

  return { results, error, isPending, search };
};


