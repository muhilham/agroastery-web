import type { Metadata } from "next";
import Home from "./home";

/**
 * Homepage metadata (issue #177).
 *
 * The homepage UI is a client component (app/home.tsx) and cannot export
 * metadata, so this server page module owns it. The canonical link was
 * previously missing because no segment between root and page declared
 * `alternates.canonical` — metadataBase alone only absolutizes relative URLs
 * that some level provides. Root-level title/description/OG stay in
 * app/layout.tsx and inherit here.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default Home;
