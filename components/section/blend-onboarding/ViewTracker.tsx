"use client";

import { useEffect, useRef } from "react";

type ViewTrackerProps = {
  onView: () => void;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
};

export function ViewTracker({ onView, children, className, threshold = 0.4 }: ViewTrackerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const firedRef = useRef(false);
  const onViewRef = useRef(onView);
  onViewRef.current = onView;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !firedRef.current) {
            firedRef.current = true;
            onViewRef.current();
            observer.disconnect();
          }
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
