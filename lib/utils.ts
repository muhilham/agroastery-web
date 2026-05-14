import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const slugify = (slug: string) =>
  slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

/**
 * Strip HTML tags from a string and return plain text.
 * Safe for use in JSX where HTML should not be rendered.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
