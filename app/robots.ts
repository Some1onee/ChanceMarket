import type { MetadataRoute } from "next";
import { brand } from "@/lib/config/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/seller", "/api", "/auth"],
      },
    ],
    sitemap: `${brand.url}/sitemap.xml`,
  };
}
