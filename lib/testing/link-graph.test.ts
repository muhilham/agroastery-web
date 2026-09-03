import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { footer, menuItems } from "@/constant/menu-list";

const APP_DIRECTORY = join(process.cwd(), "app");

function staticRoutes(directory = APP_DIRECTORY): Set<string> {
  const routes = new Set<string>();
  const visit = (current: string) => {
    const entries = readdirSync(current, { withFileTypes: true });
    if (entries.some((entry) => entry.isFile() && entry.name === "page.tsx")) {
      const segments = relative(APP_DIRECTORY, current)
        .split("/")
        .filter((segment) => segment && !segment.startsWith("(") && !segment.startsWith("["));
      routes.add(segments.length ? `/${segments.join("/")}` : "/");
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === "api" || entry.name.startsWith("[")) continue;
      visit(join(current, entry.name));
    }
  };
  visit(directory);
  return routes;
}

function internalHref(href: string): string | null {
  if (!href.startsWith("/")) return null;
  return href.split(/[?#]/, 1)[0] || "/";
}

function homepageInternalHrefs(): string[] {
  const source = readFileSync(join(APP_DIRECTORY, "page.tsx"), "utf8");
  return [...source.matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1]);
}

describe("public navigation link graph", () => {
  const routes = staticRoutes();
  const internalLinks = [
    ...menuItems.map((item) => item.link),
    ...footer.map((item) => item.href),
    ...homepageInternalHrefs(),
  ].flatMap((href) => {
    const route = internalHref(href);
    return route ? [{ href, route }] : [];
  });

  it("keeps every internal nav, footer, and homepage href on a static route", () => {
    for (const { href, route } of internalLinks) {
      expect(routes, `${href} must resolve to an app/ page`).toContain(route);
    }
  });

  it("keeps external menu and footer links as http(s) URLs", () => {
    for (const href of [...menuItems.map((item) => item.link), ...footer.map((item) => item.href)]) {
      if (!internalHref(href)) expect(href).toMatch(/^https?:\/\//);
    }
  });

  it("retains the customer-facing footer route links", () => {
    expect(footer.filter((item) => internalHref(item.href)).map((item) => item.href)).toEqual([
      "/roast-age",
      "/konsultasi",
      "/syarat-ketentuan",
      "/kebijakan-privasi",
    ]);
  });
});
