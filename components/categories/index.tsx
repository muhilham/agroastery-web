"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CategoriesProps {
  categories: string[];
  activeCategoryId: string | null;
}

const Categories = ({ categories, activeCategoryId }: CategoriesProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelect = (category: string | null) => {
    router.push(
      category ? `/katalog?category=${encodeURIComponent(category)}` : "/katalog"
    );
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="px-5 mb-5 desktop:hidden">
        <SheetTrigger className="text-primary rounded-full border bg-[#f5ebc9]/10 border-primary w-full inline-flex justify-between px-4 py-2 text-sm">
          <span>{activeCategoryId ?? "Semua Kategori"}</span>
          <span>▾</span>
        </SheetTrigger>
      </div>

      <SheetContent side="bottom" className="pb-4">
        <SheetHeader className="mb-2">
          <SheetTitle>Kategori</SheetTitle>
        </SheetHeader>

        <button
          type="button"
          onClick={() => handleSelect(null)}
          className={`text-secondary inline-flex justify-between w-full border-b py-2 text-base mb-2 cursor-pointer ${
            activeCategoryId === null ? "font-semibold" : "font-normal"
          }`}
          aria-pressed={activeCategoryId === null}
        >
          <span>Semua Kategori</span>
          {activeCategoryId === null && <Check aria-hidden="true" />}
        </button>

        {categories.map((cat) => {
          const active = activeCategoryId === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleSelect(cat)}
              className={`text-secondary inline-flex justify-between w-full border-b py-2 text-base mb-2 cursor-pointer ${
                active ? "font-semibold" : "font-normal"
              }`}
              aria-pressed={active}
            >
              <span>{cat}</span>
              {active && <Check aria-hidden="true" />}
            </button>
          );
        })}
      </SheetContent>
    </Sheet>
  );
};

export default Categories;
