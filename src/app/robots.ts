import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: "https://www.rmotion.fr/sitemap.xml",
    host: "https://www.rmotion.fr",
  };
}
