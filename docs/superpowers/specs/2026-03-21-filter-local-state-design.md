# Filter Local State Decoupling Design

**Date:** 2026-03-21
**Status:** Approved

## Problem

點擊過濾器 checkbox 後，需要等待 Next.js App Router 完成 RSC round-trip（重新渲染 Server Component）後 `useSearchParams()` 才更新，React Query 才開始 fetch。造成明顯的「點了沒反應」延遲。

## Root Cause

`category-products-content.tsx` 的 `filterParams` 從 `useSearchParams()` 衍生，React Query queryKey 依賴 `filterParams`。`router.push` 觸發 Next.js navigation → server RSC render → `useSearchParams` 更新 → React Query 才 fetch。

## Solution

將 filter 狀態移入 `useState`（local state），讓 React Query 直接用 local state 作為 queryKey。點擊時立即更新 local state（fetch 馬上開始），`router.replace` 在背景同步 URL（不阻塞 fetch）。

## Changes

### 唯一修改的檔案

`src/modules/category-products/ui/view/category-products-content.tsx`

### 1. 新增 local state

```ts
const [localFilters, setLocalFilters] = useState({
  categories: searchParams.get("categories")?.split(",").filter(Boolean) || [],
  brands: searchParams.get("brands")?.split(",").filter(Boolean) || [],
  sortBy: searchParams.get("sortBy") || "newest",
});
```

### 2. React Query 改用 localFilters

```ts
useInfiniteFilteredProductsByCollection({
  collectionId,
  categorySlug,
  ...localFilters,
  limit: 8,
  initialData,
});
```

### 3. Filter 更新：先計算新 state，再同步更新 localFilters 和 URL

**重要：URL 必須從 `newFilters`（local state）建構，不能讀 `searchParams`。**
`searchParams` 是 async 更新的（要等 RSC round-trip），快速連點時會有 stale URL 問題。

新增一個 `buildUrlFromFilters` helper（在 component 內部或 `lib/filter.ts`）：

```ts
function buildUrlFromFilters(filters: {
  categories: string[];
  brands: string[];
  sortBy: string;
}): string {
  const params = new URLSearchParams();
  if (filters.categories.length > 0) params.set("categories", filters.categories.join(","));
  if (filters.brands.length > 0) params.set("brands", filters.brands.join(","));
  if (filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);
  return params.toString();
}
```

三個 handler 改為：

```ts
const updateFilter = (type: "categories" | "brands", value: string, checked: boolean) => {
  const current = localFilters[type];
  const updated = checked ? [...current, value] : current.filter(v => v !== value);
  const newFilters = { ...localFilters, [type]: updated };
  setLocalFilters(newFilters);
  const query = buildUrlFromFilters(newFilters);
  router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
};

const updateSort = (sortBy: string) => {
  const newFilters = { ...localFilters, sortBy };
  setLocalFilters(newFilters);
  const query = buildUrlFromFilters(newFilters);
  router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
};

const clearFilters = () => {
  const newFilters = { categories: [], brands: [], sortBy: localFilters.sortBy };
  setLocalFilters(newFilters);
  const query = buildUrlFromFilters(newFilters);
  router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
};
```

原有的 `buildUpdatedFilters`、`buildUpdatedSort`、`buildClearedFilters` 不再在此元件使用（import 可移除）。

### 4. useEffect 同步 back/forward navigation

```ts
useEffect(() => {
  setLocalFilters({
    categories: searchParams.get("categories")?.split(",").filter(Boolean) || [],
    brands: searchParams.get("brands")?.split(",").filter(Boolean) || [],
    sortBy: searchParams.get("sortBy") || "newest",
  });
}, [searchParams]);
```

### 5. 移除 filterParams useMemo

`filterParams`（useMemo）原本供 React Query 和 UI 用。改後 React Query 用 `localFilters`，UI（PageHeader、DesktopFilters、MobileFilters）也改用 `localFilters`，`filterParams` 可以刪除。

## Out of Scope

- `router.push` → `router.replace` 的 history stack 行為變化（`scroll: false` 避免頁面跳到頂部）
- Server Component (`page.tsx`) 不做任何修改

## Expected Outcome

點擊 checkbox 後 React Query 立即開始 fetch，不需等待 RSC round-trip。URL 仍然在背景正確更新，支援分享和書籤。Back/forward 正常運作。
