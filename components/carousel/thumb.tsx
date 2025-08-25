import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
type PropType = {
  selected: boolean;
  index: number;
  onClick: () => void;
};

export const Thumb: React.FC<PropType> = (props) => {
  const { selected, onClick } = props;

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
        className="w-full bg-[#242424] max-w-[80px] rounded-lg p-4"
      >
        <Image
          src="/assets/coffe/blend-gayo.png"
          alt="title"
          width={500}
          height={500}
        />
      </button>
    </div>
  );
};
