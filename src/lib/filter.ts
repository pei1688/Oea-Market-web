import { ReadonlyURLSearchParams } from "next/navigation";

export function buildUpdatedFilters(
  searchParams: ReadonlyURLSearchParams,
  type: "categories" | "brands",
  value: string,
  checked: boolean,
): string {
  const params = new URLSearchParams(searchParams);
  const current = params.get(type)?.split(",").filter(Boolean) || [];

  let updated;
  if (checked) {
    updated = [...current, value];
  } else {
    updated = current.filter((item) => item !== value);
  }

  if (updated.length === 0) {
    params.delete(type);
  } else {
    params.set(type, updated.join(","));
  }

  params.delete("page"); // 重置頁碼
  return params.toString();
}

/*更新排序 */
export function buildUpdatedSort(
  searchParams: ReadonlyURLSearchParams,
  sortBy: string,
): string {
  const params = new URLSearchParams(searchParams);
  params.set("sortBy", sortBy);
  params.delete("page");
  return params.toString();
}

/*清除所有過濾器（保留排序）*/
export function buildClearedFilters(filterParams: { sortBy: string }): string {
  const params = new URLSearchParams();
  if (filterParams.sortBy !== "newest") {
    params.set("sortBy", filterParams.sortBy);
  }
  return params.toString();
}
