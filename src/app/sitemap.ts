import type { MetadataRoute } from "next";
import { getCollections } from "@/action/collection";
import { getProductsForSitemap } from "@/action/product";

const BASE_URL = "https://oea-market-web.vercel.app";
const STATIC_DATE = new Date("2025-01-01");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([
    getProductsForSitemap(),
    getCollections(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1.0, lastModified: STATIC_DATE },
    { url: `${BASE_URL}/collections`, changeFrequency: "weekly", priority: 0.8, lastModified: STATIC_DATE },
    { url: `${BASE_URL}/news`, changeFrequency: "weekly", priority: 0.6, lastModified: STATIC_DATE },
    { url: `${BASE_URL}/search`, changeFrequency: "monthly", priority: 0.5, lastModified: STATIC_DATE },
  ];

  const collectionPages: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${BASE_URL}/collections/${c.id}/全部`,
    changeFrequency: "daily",
    priority: 0.8,
    lastModified: c.updatedAt ?? STATIC_DATE,
  }));

  const productPages: MetadataRoute.Sitemap = products
    .filter((p) => p.productCollections.length > 0)
    .map((p) => {
      const collectionId = p.productCollections[0].collection.id;
      return {
        url: `${BASE_URL}/collections/${collectionId}/全部/product/${p.id}`,
        changeFrequency: "daily",
        priority: 0.9,
        lastModified: p.updatedAt ?? STATIC_DATE,
      };
    });

  return [...staticPages, ...collectionPages, ...productPages];
}
