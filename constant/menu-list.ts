import { I_FooterInterface, I_MenuListInterface } from "@/types/ui";
import {
  DOUBLE_ESPRESSO,
  INSTAGRAM,
  LOWONGAN_KERJA,
  SHOPEE,
  TELEGRAM,
  TIKTOK,
  TOKOPEDIA,
  WHATSAPP,
} from "./resource-and-link";

export const menuItems: I_MenuListInterface[] = [
  { name: "Katalog", link: "/katalog" },
  { name: "Tokopedia", link: TOKOPEDIA },
  { name: "Shopee", link: SHOPEE },
  { name: "WhatsApp", link: WHATSAPP },
  { name: "Telegram", link: TELEGRAM },
  { name: "Instagram", link: INSTAGRAM },
  { name: "Tiktok", link: TIKTOK },
  { name: "Double Espresso", link: DOUBLE_ESPRESSO },
  { name: "Lowongan Kerja", link: LOWONGAN_KERJA },
];

export const footer: I_FooterInterface[] = [
  { href: "https://www.tokopedia.com/agroastery", label: "Tokopedia" },
  { href: "https://shopee.co.id/agroastery", label: "Shopee" },
  {
    href: "https://api.whatsapp.com/send?phone=628979092726",
    label: "WhatsApp",
  },
  { href: "https://t.me/agroastery", label: "Telegram" },
  { href: "https://www.instagram.com/agroastery/", label: "Instagram" },
  { href: "https://www.tiktok.com/@agroastery", label: "Tiktok" },
];
