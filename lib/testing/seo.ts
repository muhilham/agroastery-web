/**
 * SEO test helpers (issue #133).
 *
 * Two layers:
 * - expectSeo(): object-level assertions on a page module's exported `metadata`
 *   (catches dropped/changed exports, zero rendering).
 * - renderMetaTags(): DOM-level — pushes the segment chain through Next's own
 *   metadata resolution (createMetadataComponents over a fake loader tree), so
 *   assertions cover metadataBase absolutization, title/OG inheritance, and
 *   robots rendering exactly as the framework ships them.
 *
 * Scope: statically-exported metadata (decided on #133). generateMetadata
 * pages (product/[slug]) are out of scope until the harness grows data mocks.
 */
import { expect } from "vitest";
import type { Metadata } from "next";

type MetadataModule = { metadata?: Metadata };

/**
 * Render the `<head>` tags Next would emit for a page.
 *
 * @param rootLayout  app/layout.tsx module (provides metadataBase + defaults)
 * @param page        the page module (its `metadata` export)
 * @param options.segments   URL segments between root and page, e.g. ["konsultasi"]
 * @param options.pathname   request pathname, e.g. "/konsultasi"
 */
export async function renderMetaTags(
  rootLayout: MetadataModule,
  page: MetadataModule,
  { segments = [], pathname = "/" }: { segments?: string[]; pathname?: string } = {},
): Promise<{ document: Document; html: string }> {
  const React = await import("react");
  const { renderToReadableStream } = await import("react-dom/server");
  const { createMetadataComponents } = (await import(
    "next/dist/lib/metadata/metadata.js" as string
  )) as any;
  const { workAsyncStorage } = (await import(
    "next/dist/server/app-render/work-async-storage.external.js" as string
  )) as any;
  const { workUnitAsyncStorage } = (await import(
    "next/dist/server/app-render/work-unit-async-storage.external.js" as string
  )) as any;

  const loader = (mod: MetadataModule) => [
    () => Promise.resolve(mod),
    "test",
  ];

  // Loader tree: '' root (layout) > one node per segment > __PAGE__ (page).
  let subtree: unknown = ["__PAGE__", {}, { page: loader(page) }];
  for (let i = segments.length - 1; i >= 0; i--) {
    subtree = [segments[i], { children: subtree }, {}];
  }
  const tree = ["", { children: subtree }, { layout: loader(rootLayout) }];

  const workStore = {
    route: `/${segments.join("/")}/page`,
    pagePath: `/${segments.join("/")}/page`,
    pageType: "page",
    isDynamic: false,
    isStaticGeneration: true,
    nextExport: false,
    assetPrefix: "",
    basePath: "",
    buildId: "test",
    generateBuildId: null,
    strictMode: false,
    serverComponentsHmrCache: new Map(),
    staticUsage: new Set(),
    shouldPreferStale: false,
    isRevalidate: false,
    experimental: {},
    fetchCache: false,
    distDir: ".next",
    canonicalBase: "",
    rootParams: {},
    requestProtocol: "https",
    isAppRouter: true,
    revalidate: 0,
  };

  // createMetadataComponents eagerly builds searchParams/pathname accessors
  // that read workAsyncStorage — construct and render it inside the store.
  let stream: ReadableStream<Uint8Array>;
  try {
    stream = await workAsyncStorage.run(
      workStore,
      () => workUnitAsyncStorage.run({ type: "request" }, () => {
        const { Metadata } = createMetadataComponents({
          tree,
          pathname,
          parsedQuery: {},
          metadataContext: {
            trailingSlash: false,
            isStaticMetadataRouteFile: false,
          },
          interpolatedParams: {},
          serveStreamingMetadata: false,
          isRuntimePrefetchable: true,
        });
        return renderToReadableStream(React.createElement(Metadata));
      }),
    );
  } catch (e) {
    console.error("METADATA RENDER FAILED", e);
    throw e;
  }
  const html = await streamToString(stream);

  // Tests run in vitest's jsdom environment — parse via the live DOM.
  const parsed = new DOMParser().parseFromString(
    `<html><head>${html}</head></html>`,
    "text/html",
  );
  return { document: parsed, html };
}

async function streamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out;
}

/** Object-level metadata assertions in one call (Tier 1 one-liner helper). */
export function expectSeo(
  mod: MetadataModule,
  expected: {
    title?: string | RegExp;
    description?: string | RegExp;
    canonical?: string;
    noindex?: boolean;
    ogImage?: string;
  },
): void {
  const metadata = mod.metadata;
  expect(metadata, "page must export const metadata").toBeDefined();

  if (expected.title !== undefined) {
    expect(String(metadata!.title)).toMatch(toMatcher(expected.title));
  }
  if (expected.description !== undefined) {
    expect(String(metadata!.description ?? "")).toMatch(
      toMatcher(expected.description),
    );
  }
  if (expected.canonical !== undefined) {
    const canonical = metadata!.alternates?.canonical;
    expect(
      typeof canonical === "string" || canonical instanceof URL
        ? String(canonical)
        : (canonical as { url?: string })?.url,
      "expected alternates.canonical to be set",
    ).toBeDefined();
    expect(String(canonical)).toMatch(toMatcher(expected.canonical));
  }
  if (expected.noindex !== undefined) {
    const robots = metadata!.robots as
      | { index?: boolean; follow?: boolean }
      | undefined;
    if (expected.noindex) {
      expect(robots?.index, "expected robots noindex").toBe(false);
    } else {
      expect(robots?.index ?? true, "expected indexable page").not.toBe(false);
    }
  }
  if (expected.ogImage !== undefined) {
    const images = (metadata!.openGraph?.images ?? []) as Array<
      string | { url: string }
    >;
    expect(images.length, "expected at least one og:image").toBeGreaterThan(0);
    const urls = images.map((img) => (typeof img === "string" ? img : img.url));
    expect(urls).toContain(expected.ogImage);
  }
}

function toMatcher(v: string | RegExp): RegExp {
  return v instanceof RegExp ? v : new RegExp(escapeRegExp(v), "i");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
