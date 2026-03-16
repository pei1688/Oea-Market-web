"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function SplashScreen() {
  const [shouldShow, setShouldShow] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const splashRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLHeadingElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // 檢查是否為第一次訪問
    const hasVisited = sessionStorage.getItem("hasVisitedAEpStore");

    if (!hasVisited) {
      setShouldShow(true);
      // 標記已經訪問過
      sessionStorage.setItem("hasVisitedAEpStore", "true");
    } else {
      // 如果已經訪問過，直接設為完成狀態
      setIsDone(true);
    }
  }, []);

  useGSAP(() => {
    // 只有在應該顯示且元素存在時才執行動畫
    if (!shouldShow || !splashRef.current || !logoRef.current) return;

    const ctx = gsap.context(() => {
      // Prepare text — split into letter spans
      const letters = logoRef.current!.textContent!.split("");
      logoRef.current!.innerHTML = letters
        .map((l) =>
          l === " "
            ? `<span class="inline-block">&nbsp;</span>`
            : `<span class="inline-block">${l}</span>`,
        )
        .join("");
      const letterSpans = logoRef.current!.querySelectorAll("span");

      // Make the wrapper visible; individual spans start hidden above
      gsap.set(logoRef.current, { opacity: 1 });
      gsap.set(letterSpans, { opacity: 0, y: -40 });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          // 短暫停留後淡出整個 splash
          gsap.to(splashRef.current, {
            opacity: 0,
            duration: 0.5,
            delay: 0.6,
            onComplete: () => setIsDone(true),
          });
        },
      });

      // 每個字母依序從上方滑入
      tl.to(letterSpans, {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.045,
      });
    }, splashRef);

    return () => ctx.revert();
  }, [shouldShow]);

  if (isDone || !shouldShow) return null;

  return (
    <div
      ref={splashRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-8 bg-neutral-100"
    >
      <h1 className="letterSpans text-5xl font-bold text-neutral-800 opacity-0">
        Oea market
      </h1>
    </div>
  );
}
