"use client";

import { useState, useCallback } from "react";

export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetUrl, setTargetUrl] = useState<string>("");

  const startTransition = useCallback((url: string) => {
    setTargetUrl(url);
    setIsTransitioning(true);
  }, []);

  const onTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
    setTargetUrl("");
  }, []);

  return {
    isTransitioning,
    targetUrl,
    startTransition,
    onTransitionComplete,
  };
};