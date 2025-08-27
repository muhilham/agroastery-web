"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ThumbProps = {
  selected: boolean;
  onClick: () => void;
  src: string;
  alt?: string;
};

export const Thumb: React.FC<ThumbProps> = ({
  selected,
  onClick,
  src,
  alt = "thumb",
}) => {
  return (
    <div
      className={cn(
        "desktop:p-0 flex-shrink-0",
        selected && "border border-primary rounded-lg",
      )}
    >
      <button
        onClick={onClick}
        type="button"
        aria-pressed={selected}
        className={cn(
          "relative w-20 h-20 rounded-lg overflow-hidden bg-[#242424]",
          "focus:outline-none",
        )}
      >
        <Image src={src} alt={alt} fill className="object-cover" sizes="80px" />
      </button>
    </div>
  );
};
