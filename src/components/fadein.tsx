"use client";
import React, { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  viewport?: {
    once?: boolean;
    amount?: number;
  };
  className?: string;
}

const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.8,
  viewport = { once: true, amount: 0.2 },
  className = "",
}) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = elementRef.current;
      if (!element) return;

      gsap.set(element, {
        opacity: 0,
        y: 50,
      });

      gsap.to(element, {
        opacity: 1,
        y: 0,
        duration: duration,
        delay: delay,
        ease: "power2.out",
        scrollTrigger: {
          trigger: element,
          start: `top ${100 - (viewport.amount || 0.2) * 100}%`,
          once: viewport.once !== false,
          toggleActions: viewport.once
            ? "play none none none"
            : "play none none reverse",
        },
      });
    },
    { dependencies: [delay, duration, viewport], scope: elementRef },
  );

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
};

export default FadeIn;
