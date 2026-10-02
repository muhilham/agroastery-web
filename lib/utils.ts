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
 * Strip HTML tags and decode common HTML entities from a string.
 * Handles: &nbsp; &amp; &lt; &gt; &quot; &#39;
 * Returns plain text safe for display in JSX.
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  // Decode common HTML entities first (order matters: &amp; must come before others)
  const decoded = html
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ');
  // Then strip remaining HTML tags
  return decoded.replace(/<[^>]*>/g, '');
}
