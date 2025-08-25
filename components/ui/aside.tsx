"use client";

import { cn } from "@/lib/utils";
import { useStore } from "@nanostores/react";
import { $categories, $selectedCategoryId } from "@/lib/stores/category";

export function Aside() {
  const categories = useStore($categories);
  const selectedCategoryId = useStore($selectedCategoryId);

  const Menu = [
    { category_id: null, category_name: "Semua Produk" },
    ...categories,
  ];

  const handleSelect = (categoryId: string | null) => {
    $selectedCategoryId.set(categoryId);
  };

  return (
    <aside className="desktop:block hidden">
      <div className="w-[232px] sticky rounded-xl bg-[#242424] border border-primary p-6">
        <ul className="flex flex-col gap-4">
          {Menu.map((item) => {
            const isActive = selectedCategoryId === item.category_id;

            return (
              <li
                key={item.category_id ?? "all"}
                className={cn(
                  "text-primary text-sm font-normal cursor-pointer hover:bg-primary hover:text-[#242424] px-4 py-2 rounded-lg",
                  isActive && "bg-primary text-[#242424]",
                )}
                onClick={() => handleSelect(item.category_id)}
              >
                {item.category_name}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
