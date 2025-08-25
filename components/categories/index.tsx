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
const Categories = () => {
  const categories = useStore($categories);
  const selectedCategoryId = useStore($selectedCategoryId);

  const selectedCategory = categories.find(
    (category) => category.category_id === selectedCategoryId,
  );
  const handleSelect = (categoryId: string) => {
    if (selectedCategoryId === categoryId) {
      $selectedCategoryId.set(null);
    } else {
      $selectedCategoryId.set(categoryId);
    }
  };

  return (
    <Sheet>
      <div className="px-5 mb-5 desktop:hidden">
        <SheetTrigger className="text-primary rounded-full border bg-[#f5ebc9]/10 border-primary w-full inline-flex justify-between px-4 py-2 text-sm">
          <span>
            {selectedCategory
              ? selectedCategory.category_name
              : "Semua Kategori"}
          </span>
          <span>X</span>
        </SheetTrigger>
      </div>
      <SheetContent side="bottom">
        <SheetHeader className="mb-2">
          <SheetTitle>Kategori</SheetTitle>
        </SheetHeader>
        {categories.map((category) => (
          <div
            key={category.category_id}
            onClick={() => handleSelect(category.category_id)}
            className={`text-secondary inline-flex justify-between w-full border-b py-2 text-base font-normal mb-2 cursor-pointer ${
              selectedCategoryId === category.category_id ? "font-semibold" : ""
            }`}
          >
            <p>{category.category_name}</p>
            {selectedCategoryId === category.category_id && <Check />}
          </div>
        ))}{" "}
      </SheetContent>
    </Sheet>
  );
};

export default Categories;
