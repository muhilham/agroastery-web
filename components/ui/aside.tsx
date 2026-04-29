import Link from "next/link";
import { cn } from "@/lib/utils";

interface AsideProps {
  categories: string[];
  activeCategoryId: string | null;
}

export function Aside({ categories, activeCategoryId }: AsideProps) {
  return (
    <aside className="desktop:block hidden">
      <div className="w-[232px] sticky rounded-xl bg-[#242424] border border-primary p-6">
        <ul className="flex flex-col gap-4">
          <li>
            <Link
              href="/katalog"
              className={cn(
                "text-primary text-sm font-normal block hover:bg-primary hover:text-[#242424] px-4 py-2 rounded-lg",
                activeCategoryId === null && "bg-primary text-[#242424]",
              )}
            >
              Semua Produk
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat}>
              <Link
                href={`/katalog?category=${encodeURIComponent(cat)}`}
                className={cn(
                  "text-primary text-sm font-normal block hover:bg-primary hover:text-[#242424] px-4 py-2 rounded-lg",
                  activeCategoryId === cat && "bg-primary text-[#242424]",
                )}
              >
                {cat}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
