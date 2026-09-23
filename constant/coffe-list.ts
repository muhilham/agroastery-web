import { I_ContentInterface } from "@/types/ui";

export const coffeList: I_ContentInterface[] = [
  {
    title: "STANDARD GAYO ARABICA",
    subtitle:
      "Arabica semi-washed dari 1600 mdpl, ideal untuk espresso dan latte dengan body ringan, sweetness tinggi dan acidity rendah.",
    image: "/assets/coffe/blend-gayo.png",
    href: "/product/biji-kopi-standard-gayo-full-arabica",
    price: 59000,
    // Prod: "Roast Level: Medium"
    roastLevel: "Medium",
  },
  {
    title: "BLEND KOPI SUSU EKONOMIS",
    subtitle:
      "Campuran 50% Arabica dan 50% Robusta, ideal untuk es kopi susu dengan rasa seimbang dan harga ekonomis.",
    image: "/assets/coffe/blend-kopi-susu.png",
    href: "/product/biji-kopi-blend-5050-kopi-susu-ekonomis",
    price: 32000,
    // Prod: "Roast Level: FullCity+ (very early second crack / early stage dark roast)"
    roastLevel: "Dark",
  },
  {
    title: "HOUSE BLEND ARABICA & ROBUSTA",
    subtitle:
      "Espresso blend dengan karakter cokelat manis dan sweetness kuat, cocok untuk kopi susu hingga long black.",
    image: "/assets/coffe/blend-house.png",
    href: "/product/house-blend-espresso-arabica-fine-robusta-es46",
    price: 43000,
    // Prod: Arabica Fullcity+ (dark) / Robusta Fullcity (medium-dark)
    roastLevel: "Medium-Dark",
  },
  {
    title: "SOLOK SELATAN FULL ARABICA",
    subtitle:
      "Arabica berkualitas dengan sangrai optimal, pas untuk espresso, americano, long black, latte, dan cappuccino.",
    image: "/assets/coffe/blend-solok.png",
    href: "/product/biji-kopi-standard-solok-selatan-full-arabica",
    price: 61000,
    // Prod: "Fullcityplus / Very Early Second Crack / Dark Roast"
    roastLevel: "Dark",
  },
];
