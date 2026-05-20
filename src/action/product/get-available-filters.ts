"use server";

import { getAvailableFilters } from "@/lib/cached-queries";

export type AvailableFiltersResult = {
  categories: string[];
  brands: string[];
};

export async function getAvailableFiltersByCollection(
  collectionId: string,
): Promise<AvailableFiltersResult> {
  return getAvailableFilters(collectionId);
}
