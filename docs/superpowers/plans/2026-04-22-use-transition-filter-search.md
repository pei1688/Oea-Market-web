# useTransition Filter & Search Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap non-urgent state updates in `useTransition` so filter checkbox/sort clicks feel instant, and remove a redundant 300ms setTimeout from search.

**Architecture:** Two independent changes. (1) `category-products-content.tsx` adds one `useTransition` that defers `setLocalFilters` (the heavy ProductGrid re-render) while keeping `router.replace` immediate. `isPending` is merged from both the transition and React Query's `isFetching` so child components see a continuous loading signal. (2) `search-content.tsx` removes a `setTimeout` wrapper that served no purpose because search is triggered by URL navigation, not keystrokes — `useTransition` in `use-search.ts` already handles non-blocking execution.

**Tech Stack:** Next.js 14 App Router, React 18 `useTransition`, TanStack React Query, Zustand

---

## File Map

| File | Change |
|------|--------|
| `src/modules/category-products/ui/view/category-products-content.tsx` | Add `useTransition`, wrap `setLocalFilters` in `startFilterTransition`, merge `isPending` |
| `src/modules/search/ui/view/search-content.tsx` | Remove `setTimeout` wrapper, call `search(query)` directly |

No other files change.

---

## Task 1: Add useTransition to category filter handlers

**Files:**
- Modify: `src/modules/category-products/ui/view/category-products-content.tsx`

### Context

The file currently imports `useState` and `useEffect` from React (line 2). The three filter handlers (`updateFilter`, `updateSort`, `clearFilters`) all call `setLocalFilters` synchronously, which forces React to treat the expensive ProductGrid re-render as urgent work. `isFetching` from React Query is passed as `isPending` to all child components.

### Steps

- [ ] **Step 1: Add `useTransition` to the React import**

In `src/modules/category-products/ui/view/category-products-content.tsx`, change line 2:

```ts
// Before
import { useState, useEffect } from "react";

// After
import { useState, useEffect, useTransition } from "react";
```

- [ ] **Step 2: Declare the transition inside the component**

After the existing `useState` declarations (after line 53, before the `useInfiniteFilteredProductsByCollection` call), add:

```ts
const [isFilterPending, startFilterTransition] = useTransition();
```

- [ ] **Step 3: Wrap `setLocalFilters` in `updateFilter`**

Replace the `updateFilter` function (lines 92–105) with:

```ts
const updateFilter = (
  type: "categories" | "brands",
  value: string,
  checked: boolean,
) => {
  const current = localFilters[type];
  const updated = checked
    ? [...current, value]
    : current.filter((v) => v !== value);
  const newFilters = { ...localFilters, [type]: updated };
  const query = buildUrlFromFilters(newFilters);
  router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  startFilterTransition(() => {
    setLocalFilters(newFilters);
  });
};
```

- [ ] **Step 4: Wrap `setLocalFilters` in `updateSort`**

Replace the `updateSort` function (lines 107–112) with:

```ts
const updateSort = (sortBy: string) => {
  const newFilters = { ...localFilters, sortBy };
  const query = buildUrlFromFilters(newFilters);
  router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  startFilterTransition(() => {
    setLocalFilters(newFilters);
  });
};
```

- [ ] **Step 5: Wrap `setLocalFilters` in `clearFilters`**

Replace the `clearFilters` function (lines 114–121) with:

```ts
const clearFilters = () => {
  const newFilters = { categories: [], brands: [], sortBy: localFilters.sortBy };
  const query = buildUrlFromFilters(newFilters);
  router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  startFilterTransition(() => {
    setLocalFilters(newFilters);
  });
};
```

- [ ] **Step 6: Merge `isPending` for child components**

Just before the `if (isError)` check (around line 123), add:

```ts
const isPending = isFilterPending || isFetching;
```

This replaces the inline `isFetching` references passed to child components. The `isPending` variable already exists in JSX via `isFetching` — now it comes from this merged value. Confirm the JSX below already passes `isPending={isFetching}` in these four places and they will naturally pick up the new `isPending` variable since it shadows the usage:

- `<PageHeader isPending={isFetching}` → change to `isPending={isPending}`
- `<DesktopFilters isPending={isFetching}` → change to `isPending={isPending}`
- `<ProductGrid isPending={isFetching && !isFetchingNextPage}` → change to `isPending={isPending && !isFetchingNextPage}`
- `<MobileFilters isPending={isFetching}` → change to `isPending={isPending}`

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Manual verification**

Start the dev server:
```bash
pnpm dev
```

Navigate to any collection page (e.g. `/collections/[id]/全部`).

Check these behaviors:
1. Click a brand or category checkbox → checkbox updates visually **immediately**, product grid shows loading overlay
2. Change sort order → sort select updates **immediately**, product grid shows loading overlay
3. Click "清除過濾器" → button disappears **immediately**, product grid reloads
4. Use browser back/forward → filters restore correctly (the `useEffect` sync is unaffected)

- [ ] **Step 9: Commit**

```bash
git add src/modules/category-products/ui/view/category-products-content.tsx
git commit -m "feat: wrap filter state updates in useTransition for instant checkbox feedback"
```

---

## Task 2: Remove redundant setTimeout from search

**Files:**
- Modify: `src/modules/search/ui/view/search-content.tsx`

### Context

`use-search.ts` already wraps the async search call in `useTransition` (line 9–10). The `useEffect` in `search-content.tsx` (lines 13–22) wraps `search(query)` in a `setTimeout(..., 300)`. Since search is triggered by URL navigation (user submits the form in `navbar-search.tsx` → `router.push('/search?q=...')`) rather than by keystroke, `searchParams` only changes once per search — the debounce has no effect and only adds latency.

### Steps

- [ ] **Step 1: Remove the setTimeout from the useEffect**

In `src/modules/search/ui/view/search-content.tsx`, replace lines 13–22:

```ts
// Before
useEffect(() => {
  if (query) {
    setSearchQuery(query);
    const timeoutId = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }
}, [query, search]);

// After
useEffect(() => {
  if (query) {
    setSearchQuery(query);
    search(query);
  }
}, [query, search]);
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual verification**

Navigate to any page, click the search icon, type a keyword, press Enter.

Check these behaviors:
1. Search results page loads and `<Spinner />` appears immediately (no 300ms blank gap)
2. Results appear once the server action completes
3. Searching the same keyword again shows results correctly
4. Searching an empty/no-match term shows "沒有找到相關商品"

- [ ] **Step 4: Commit**

```bash
git add src/modules/search/ui/view/search-content.tsx
git commit -m "fix: remove redundant setTimeout from search, useTransition already handles non-blocking"
```
