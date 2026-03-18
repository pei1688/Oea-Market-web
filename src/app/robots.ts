import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/cart", "/checkout", "/api"],
    },
    sitemap: "https://oea-market-web.vercel.app/sitemap.xml",
  };
}
