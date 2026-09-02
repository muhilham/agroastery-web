import { I_FooterInterface, I_MenuListInterface } from "@/types/ui";
import {
  DOUBLE_ESPRESSO,
  INSTAGRAM,
  LOWONGAN_KERJA,
  TELEGRAM,
  TIKTOK,
  WHATSAPP,
} from "./resource-and-link";

export const menuItems: I_MenuListInterface[] = [
  { name: "Buy Now", link: "/katalog" },
  { name: "Konsultasi", link: "/konsultasi" },
  { name: "WhatsApp", link: WHATSAPP },
  { name: "Telegram", link: TELEGRAM },
  { name: "Instagram", link: INSTAGRAM },
  { name: "Tiktok", link: TIKTOK },
  { name: "Double Espresso", link: DOUBLE_ESPRESSO },
  { name: "Lowongan Kerja", link: LOWONGAN_KERJA },
];

export const footer: I_FooterInterface[] = [
  {
    href: "https://api.whatsapp.com/send?phone=628979092726",
    label: "WhatsApp",
  },
  { href: "https://t.me/agroastery", label: "Telegram" },
  { href: "https://www.instagram.com/agroastery/", label: "Instagram" },
  { href: "https://www.tiktok.com/@agroastery", label: "Tiktok" },
  { href: "/roast-age", label: "Roast Age" },
  { href: "/syarat-ketentuan", label: "Syarat & Ketentuan" },
  { href: "/kebijakan-privasi", label: "Kebijakan Privasi" },
];
