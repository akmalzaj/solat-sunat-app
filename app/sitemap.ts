import type { MetadataRoute } from "next";
// Relative import with explicit .ts extension (not the "@/content/registry"
// alias used elsewhere in app/) so `node --test --experimental-strip-types`
// can resolve this module directly. Allowed by tsconfig's
// allowImportingTsExtensions + moduleResolution "bundler".
import { guides } from "../content/registry.ts";
import { SITE_URL } from "../lib/site.ts";

export const dynamic = "force-static";

// Static content surfaces; URLs follow next.config.ts `trailingSlash: true`.
// The home entry is "/" (not "") so the sitemap URL matches the page's
// canonical (https://solat.wiki/) byte for byte.
const STATIC_PATHS = ["/", "/alatan/", "/bantuan/", "/simpanan/", "/tetapan/"];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
  }));

  const guideEntries: MetadataRoute.Sitemap = guides
    .filter((guide) => guide.reviewStatus === "approved")
    .map((guide) => ({
      url: `${SITE_URL}/solat/${guide.slug}/`,
      lastModified: guide.lastReviewedAt ? new Date(guide.lastReviewedAt) : undefined,
    }));

  return [...staticEntries, ...guideEntries];
}