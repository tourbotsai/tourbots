import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/resources/", "/demo/", "/features/", "/pricing/", "/contact/"],
        disallow: ["/app/", "/admin/", "/api/", "/embed/", "/__/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
