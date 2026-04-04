import Link from "next/link";
import { cn } from "@/lib/utils";
import type { TCategory } from "@/types/categories";

interface AsideProps {
  categories: TCategory[];
  activeCategoryId: string | null;
}

export function Aside({ categories, activeCategoryId }: AsideProps) {
  const menu = [
    { category_id: null, category_name: "Semua Produk" },
    ...categories,
  ];

  return (
    <aside className="desktop:block hidden">
      <div className="w-[232px] sticky rounded-xl bg-[#242424] border border-primary p-6">
        <ul className="flex flex-col gap-4">
          {menu.map((item) => {
            const isActive = activeCategoryId === item.category_id;
            return (
              <li key={item.category_id ?? "all"}>
                <Link
                  href={
                    item.category_id
                      ? `/katalog?category=${item.category_id}`
                      : "/katalog"
                  }
                  className={cn(
                    "text-primary text-sm font-normal block hover:bg-primary hover:text-[#242424] px-4 py-2 rounded-lg",
                    isActive && "bg-primary text-[#242424]",
                  )}
                >
                  {item.category_name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
