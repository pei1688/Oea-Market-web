"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

const ReactQueryProvider = ({ children }: ReactQueryProviderProps) => {
  // 使用 useState 確保 QueryClient 實例在組件生命週期中保持穩定
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 設置合理的快取時間
            staleTime: 1000 * 60 * 5, // 5 分鐘
            gcTime: 1000 * 60 * 10, // 10 分鐘 (之前的 cacheTime)
            // 確保在窗口重新聚焦時重新獲取數據
            refetchOnWindowFocus: true,
            // 網路重新連接時重新獲取
            refetchOnReconnect: true,
            // 重試配置
            retry: 1,
          },
          mutations: {
            // mutation 失敗時重試一次
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      {children}
    </QueryClientProvider>
  );
};

export default ReactQueryProvider;
