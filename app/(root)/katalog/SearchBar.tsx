"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();

  const searchValue = searchParams.get("search") ?? "";
  const [inputValue, setInputValue] = useState(searchValue);
  const [isFocused, setIsFocused] = useState(false);

  // Sync with URL when changed externally (e.g. back button, filter change)
  // Skip if input is focused to avoid interrupting typing
  if (!isFocused && inputValue !== searchValue) {
    setInputValue(searchValue);
  }

  const updateSearchParam = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("search", value.trim());
      } else {
        params.delete("search");
      }
      const query = params.toString();
      startTransition(() => {
        router.push(`${pathname}${query ? `?${query}` : ""}`);
      });
    },
    [pathname, router, searchParams],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateSearchParam(value);
    }, 300);
  };

  const handleClear = () => {
    setInputValue("");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updateSearchParam("");
  };

  return (
    <div className="relative w-full">
      <svg
        width="20"
        height="20"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#CCC4A9]/50"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M19.675 20.55L13.375 14.25C12.875 14.6666 12.2625 14.9875 11.5375 15.2125C10.8125 15.4375 10.125 15.55 9.475 15.55C7.77117 15.55 6.3285 14.9596 5.147 13.779C3.96567 12.5985 3.375 11.1568 3.375 9.45398C3.375 7.75131 3.96533 6.30831 5.146 5.12498C6.3265 3.94164 7.76817 3.34998 9.471 3.34998C11.1737 3.34998 12.6167 3.94064 13.8 5.12198C14.9833 6.30348 15.575 7.74614 15.575 9.44998C15.575 10.15 15.4625 10.8416 15.2375 11.525C15.0125 12.2083 14.7 12.7916 14.3 13.275L20.625 19.6L19.675 20.55ZM9.475 14.2C10.825 14.2 11.9542 13.7458 12.8625 12.8375C13.7708 11.9291 14.225 10.8 14.225 9.44998C14.225 8.09998 13.7708 6.97081 12.8625 6.06248C11.9542 5.15414 10.825 4.69998 9.475 4.69998C8.125 4.69998 6.99583 5.15414 6.0875 6.06248C5.17917 6.97081 4.725 8.09998 4.725 9.44998C4.725 10.8 5.17917 11.9291 6.0875 12.8375C6.99583 13.7458 8.125 14.2 9.475 14.2Z"
          fill="currentColor"
        />
      </svg>
      <Input
        type="text"
        placeholder="Cari produk..."
        className="w-full rounded-xl bg-[#242424] pl-10 pr-10 text-[#CCC4A9] placeholder:text-[#CCC4A9]/50"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#CCC4A9]/50 hover:text-[#CCC4A9]"
          aria-label="Clear search"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 18L18 6M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      {isPending && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#CCC4A9]/30 border-t-[#CCC4A9]" />
        </div>
      )}
    </div>
  );
}
