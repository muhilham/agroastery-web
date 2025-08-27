"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Check } from "lucide-react";
import { $categories, $selectedCategoryId } from "@/lib/stores/category";
import { useStore } from "@nanostores/react";
import { useCallback, useState } from "react";

const Categories = () => {
  const categories = useStore($categories);
  const selectedCategoryId = useStore($selectedCategoryId);
  const [open, setOpen] = useState(false);

  const selectedCategory = categories.find(
    (c) => c.category_id === selectedCategoryId,
  );

  const handleSelect = useCallback(
    (categoryId: string | null) => {
      if (categoryId === null) {
        $selectedCategoryId.set(null);
        setOpen(false);
        return;
      }

      if (selectedCategoryId === categoryId) {
        $selectedCategoryId.set(null);
      } else {
        $selectedCategoryId.set(categoryId);
      }
      setOpen(false);
    },
    [selectedCategoryId],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="px-5 mb-5 desktop:hidden">
        <SheetTrigger className="text-primary rounded-full border bg-[#f5ebc9]/10 border-primary w-full inline-flex justify-between px-4 py-2 text-sm">
          <span>
            {selectedCategory
              ? selectedCategory.category_name
              : "Semua Kategori"}
          </span>
          <span>▾</span>
        </SheetTrigger>
      </div>

      <SheetContent side="bottom" className="pb-4">
        <SheetHeader className="mb-2">
          <SheetTitle>Kategori</SheetTitle>
        </SheetHeader>

        {/* All categories (clear) */}
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className={`text-secondary inline-flex justify-between w-full border-b py-2 text-base mb-2 cursor-pointer ${
            selectedCategoryId === null ? "font-semibold" : "font-normal"
          }`}
          aria-pressed={selectedCategoryId === null}
        >
          <span>Semua Kategori</span>
          {selectedCategoryId === null && <Check aria-hidden="true" />}
        </button>

        {/* Actual categories */}
        {categories.map((category) => {
          const active = selectedCategoryId === category.category_id;
          return (
            <button
              key={category.category_id}
              type="button"
              onClick={() => handleSelect(category.category_id)}
              className={`text-secondary inline-flex justify-between w-full border-b py-2 text-base mb-2 cursor-pointer ${
                active ? "font-semibold" : "font-normal"
              }`}
              aria-pressed={active}
            >
              <span>{category.category_name}</span>
              {active && <Check aria-hidden="true" />}
            </button>
          );
        })}
      </SheetContent>
    </Sheet>
  );
};

export default Categories;
