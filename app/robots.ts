import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site.ts";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The offline fallback is an internal service-worker target, not content.
      // The noindexed sample guide stays crawlable on purpose: blocking it here
      // would prevent crawlers from ever seeing its meta robots noindex tag.
      disallow: ["/~offline/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}