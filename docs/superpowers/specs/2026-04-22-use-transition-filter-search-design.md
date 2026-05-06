# Design: useTransition Optimization — Filter & Search

**Date:** 2026-04-22  
**Scope:** `category-products-content.tsx`, `search-content.tsx`  
**Approach:** Method B — separate urgent / non-urgent state updates

---

## Problem

### Category Filters
`updateFilter`, `updateSort`, and `clearFilters` all call `setLocalFilters` synchronously. React treats the resulting ProductGrid re-render (all product cards) as urgent work, causing a brief jank on checkbox/sort interactions even before any network request begins.

### Search
`use-search.ts` correctly wraps the async fetch in `useTransition`. However, `search-content.tsx` wraps the `search()` call in a redundant `setTimeout(..., 300)`. Since search is triggered by URL change (user presses Enter → `router.push`) rather than by keystroke, `searchParams` does not change on every keypress — the debounce does nothing except add a 300ms perceived delay after navigation.

---

## Design

### 1. `category-products-content.tsx`

Add one `useTransition` for filter state updates.

**Rule:** URL update is urgent (runs outside transition). Local state update that drives ProductGrid re-render is non-urgent (runs inside transition).

```ts
const [isFilterPending, startFilterTransition] = useTransition()

const updateFilter = (type, value, checked) => {
  const newFilters = { ...localFilters, [type]: updated }
  router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false }) // urgent
  startFilterTransition(() => {
    setLocalFilters(newFilters) // non-urgent: defers ProductGrid re-render
  })
}

const updateSort = (sortBy) => {
  const newFilters = { ...localFilters, sortBy }
  router.replace(...)  // urgent
  startFilterTransition(() => {
    setLocalFilters(newFilters)
  })
}

const clearFilters = () => {
  const newFilters = { categories: [], brands: [], sortBy: localFilters.sortBy }
  router.replace(...)  // urgent
  startFilterTransition(() => {
    setLocalFilters(newFilters)
  })
}
```

**`isPending` merging:** Both transition pending and React Query fetching should show the loading indicator. Combine into one value passed to child components:

```ts
const isPending = isFilterPending || isFetching
```

This covers the full "click → data displayed" cycle without a gap between render completion and fetch completion.

**No changes to child component props** — `DesktopFilters`, `MobileFilters`, `ProductGrid`, and `PageHeader` all already accept `isPending: boolean`. The merged value is a drop-in replacement.

---

### 2. `search-content.tsx`

Remove the redundant `setTimeout`. Call `search(query)` directly inside the `useEffect`.

```ts
// Before
useEffect(() => {
  if (query) {
    setSearchQuery(query)
    const timeoutId = setTimeout(() => {
      search(query)
    }, 300)
    return () => clearTimeout(timeoutId)
  }
}, [query, search])

// After
useEffect(() => {
  if (query) {
    setSearchQuery(query)
    search(query)
  }
}, [query, search])
```

`useTransition` in `use-search.ts` already handles non-blocking execution. The `isPending` flag from that hook is used to show/hide the `<Spinner />` — no change needed there.

---

## Files Changed

| File | Change |
|------|--------|
| `src/modules/category-products/ui/view/category-products-content.tsx` | Add `useTransition`, wrap `setLocalFilters` in `startFilterTransition`, merge `isPending` |
| `src/modules/search/ui/view/search-content.tsx` | Remove `setTimeout` wrapper around `search(query)` |

**No changes to:** `use-search.ts`, `desktop-filters.tsx`, `mobile-filters.tsx`, `product-grid.tsx`, `page-header.tsx`, `toolbar.tsx`

---

## What This Does Not Change

- `use-search.ts` already correctly uses `useTransition` — no modification needed.
- `router.replace` in filter handlers stays outside the transition — URL stays in sync with clicks.
- The `useEffect` that syncs `localFilters` from browser back/forward navigation is not affected.
- React Query `staleTime` / `gcTime` settings are not affected.

---

## Success Criteria

- Clicking a filter checkbox or sort option shows immediate visual feedback (no jank).
- ProductGrid shows a loading overlay (via merged `isPending`) from click through to data display with no gap.
- Search results appear immediately after navigation without the 300ms artificial delay.
- No regression in back/forward navigation filter sync.
