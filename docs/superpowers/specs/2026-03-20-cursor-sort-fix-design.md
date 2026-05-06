# Cursor Pagination Sort Direction Fix

Date: 2026-03-20

## Bug

In `src/action/product/get-filtered-infinite.ts`, the cursor path always uses `id < cursor` and `id: "desc"` regardless of the primary sort direction. For ascending sorts (`price-low`, `name-asc`, `oldest`), this is wrong:

- `id < cursor` finds items with lower IDs — correct for DESC, wrong for ASC
- `id: "desc"` conflicts with the first page's `id: "asc"` tiebreaker, causing inconsistent page boundaries

## Fix

Before the cursor block, determine sort direction from `sortBy`, then use the correct condition and tiebreaker direction.

**Only the cursor path of the public `getInfiniteFilteredProductsByCollection` function changes.** `_getInfiniteFirstPage` (no cursor) is untouched.

## Sort Direction Mapping

| `sortBy` value | Direction | Cursor condition | id tiebreaker |
|----------------|-----------|------------------|---------------|
| `"price-low"` | ASC | `id > cursor` | `id: "asc"` |
| `"name-asc"` | ASC | `id > cursor` | `id: "asc"` |
| `"oldest"` | ASC | `id > cursor` | `id: "asc"` |
| `"price-high"` | DESC | `id < cursor` | `id: "desc"` |
| `"name-desc"` | DESC | `id < cursor` | `id: "desc"` |
| default (`"newest"`) | DESC | `id < cursor` | `id: "desc"` |

## Code Change

Replace the cursor block in the public function (currently inside the `try` block of the cursor path):

```ts
// Before (always desc — bug)
baseWhere.id = { lt: cursor };
orderBy = orderBy.map((order) =>
  "id" in order ? { id: "desc" } : order,
);
if (!orderBy.some((order) => "id" in order)) {
  orderBy.push({ id: "desc" });
}

// After (direction-aware — fix)
const isAscending = ["price-low", "name-asc", "oldest"].includes(sortBy);
baseWhere.id = isAscending ? { gt: cursor } : { lt: cursor };
orderBy = orderBy.map((order) =>
  "id" in order ? { id: isAscending ? "asc" : "desc" } : order,
);
if (!orderBy.some((order) => "id" in order)) {
  orderBy.push({ id: isAscending ? "asc" : "desc" });
}
```

## Scope

- One file modified: `src/action/product/get-filtered-infinite.ts` — cursor block only (~5 lines)
- No interface changes, no call-site changes
- `_getInfiniteFirstPage` (cached first-page function) is not touched
