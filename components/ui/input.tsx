import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-12 w-full rounded-xl bg-[#242424] px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#CCC4A9]/50 text-[#CCC4A9]/50 disabled:cursor-not-allowed disabled:opacity-50 tablet:text-sm",
          "focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-transparent",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
