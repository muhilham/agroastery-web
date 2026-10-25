"use client";

import Image from "next/image";
import { useState } from "react";
import { COFFEE_BLUR_DATA_URL } from "@/lib/blurDataUrl";

const PLACEHOLDER_SRC = "/assets/placeholder.png";

interface FallbackImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes: string;
  priority?: boolean;
}

/**
 * next/image with a graceful fallback: when the source 404s (e.g. a product
 * image missing from the CDN), swaps to the local placeholder instead of
 * rendering a broken-image icon. Guard prevents an infinite onError loop if
 * the placeholder itself fails.
 */
export function FallbackImage({ src, alt, fill, className, sizes, priority }: FallbackImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  // src prop change (e.g. variant switch on product detail) resets the fallback
  const [prevSrc, setPrevSrc] = useState(src);
  if (prevSrc !== src) {
    setPrevSrc(src);
    setCurrentSrc(src);
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={COFFEE_BLUR_DATA_URL}
      onError={() => {
        if (currentSrc !== PLACEHOLDER_SRC) setCurrentSrc(PLACEHOLDER_SRC);
      }}
    />
  );
}
