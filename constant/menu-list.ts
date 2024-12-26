import { I_MenuListInterface } from "@/interface/interface";
import { DOUBLE_ESPRESSO, INSTAGRAM, LOWONGAN_KERJA, SHOPEE, TELEGRAM, TIKTOK, TOKOPEDIA, WHATSAPP } from "./resource-and-link";

export const menuItems: I_MenuListInterface[] = [
    { name: 'Tokopedia', link: TOKOPEDIA },
    { name: 'Shopee', link: SHOPEE },
    { name: 'WhatsApp', link: WHATSAPP },
    { name: 'Telegram', link: TELEGRAM },
    { name: 'Instagram', link: INSTAGRAM },
    { name: 'Tiktok', link: TIKTOK },
    { name: 'Double Espresso', link: DOUBLE_ESPRESSO },
    { name: 'Lowongan Kerja', link: LOWONGAN_KERJA }
];