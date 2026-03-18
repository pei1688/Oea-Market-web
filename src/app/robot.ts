import { MetadataRoute } from "next";

export default function robot(): MetadataRoute.Robots {
  const baseUrl = "https://oea-market-web.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/account/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
