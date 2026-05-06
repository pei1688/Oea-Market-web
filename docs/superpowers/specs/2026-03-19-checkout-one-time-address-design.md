# Checkout One-Time Address Entry — Design Spec

**Date:** 2026-03-19
**Status:** Approved

## Overview

Allow users to fill in a one-time shipping address during checkout, in addition to selecting from their saved addresses. The address is used only for the current order and is not saved to the account.

---

## Data & Types

### `OneTimeAddressData`

Declared in `src/types/checkout.ts` alongside existing checkout types:

```ts
export interface OneTimeAddressData {
  recipientName: string;
  phoneNumber: string;
  zipCode: string;
  county: string;
  district: string;
  streetAddress: string;
}
```

### Temporary Address Assembly

When the user submits a one-time address, `useCheckout` assembles a temporary `Address`-shaped object. The `profileId` is set to `profile.id` (the current user's profile id) so the object is fully valid from TypeScript's perspective. The order API only uses address fields for shipping — it does not use `profileId` at runtime for this path.

```ts
const tempAddress: Address = {
  id: "temp",
  isDefault: false,
  profileId: profile.id,
  ...data,
}
```

`selectedAddress` remains typed as `Address | null` throughout — no type changes propagate to `OrderInfo`, `CheckOutContent`, `AddressDisplay`, or the order API.

---

## Component Changes

### `AddressSelector`

- **Structural change:** must be refactored from a pure arrow-expression component to a function-body component (`const AddressSelector = (...) => { ... }`) to support `useForm` hooks inside.
- **Dependency:** `src/components/ui/tabs.tsx` does not yet exist. Run `npx shadcn@latest add tabs` before implementation.
- Wrap Dialog content with `Tabs` (shadcn/ui), two tabs:
  - **選擇地址** — existing RadioGroup, unchanged
  - **填寫地址** — new form
- Default active tab: `選擇地址` if `addresses` prop is non-empty; `填寫地址` if empty.
- Dialog title updated to `送貨資訊`. `DialogDescription` is replaced with a visually hidden description using `VisuallyHidden` from `@radix-ui/react-visually-hidden` (already installed) to satisfy Radix accessibility requirements without showing it visually.
- New prop added:
  ```ts
  onOneTimeAddress: (data: OneTimeAddressData) => void
  ```
- Existing `onAddressSelect` prop is retained completely unchanged. The two flows (saved address / one-time form) are independent — selecting a saved address still calls `onAddressSelect(addressId)` exactly as before.
- Form state is local to `AddressSelector`. Each time the Dialog opens, the form resets to empty — no pre-population of previously entered one-time values.
- Form built with `react-hook-form` + zod. Schema: `createAddressSchema.omit({ isDefault: true })` — this ensures the inferred type matches `OneTimeAddressData` exactly and avoids a TypeScript error at the `onOneTimeAddress(data)` call site.
- On valid submit: call `onOneTimeAddress(data)`, then `onOpenChange(false)` to close the Dialog. Do NOT also call `setIsAddressDialogOpen(false)` — Dialog close is handled entirely via the prop to avoid double-close.

### `OrderInfo`

Thread new prop down:

```ts
onOneTimeAddress: (data: OneTimeAddressData) => void
```

### `CheckOutContent`

Thread new prop from `useCheckout`:

```ts
onOneTimeAddress={handleOneTimeAddress}
```

### `useCheckout`

New handler — `profile` is already available in the hook's scope:

```ts
const handleOneTimeAddress = (data: OneTimeAddressData) => {
  const tempAddress: Address = {
    id: "temp",
    isDefault: false,
    profileId: profile.id,
    ...data,
  }
  setSelectedAddress(tempAddress)
}
```

Exported from hook return value.

### `AddressDisplay`

No changes required. When `selectedAddress` is non-null (including a temp address), the display renders correctly. When it is null and `hasAddresses` is false, the "尚未設定送貨資訊" prompt correctly appears. The `isDefault: false` on a temp address means the 預設 badge is correctly suppressed.

Note: `hasAddresses` in `OrderInfo` is still computed from `profile.Address.length > 0`. This reflects whether the user has *saved* addresses, which is correct — it only affects the empty-state message, not whether a temp address is displayed.

---

## Form Validation

Derive schema via `createAddressSchema.omit({ isDefault: true })`. This ensures the inferred form data type exactly matches `OneTimeAddressData` (no `isDefault` key), preventing a TypeScript type error at the `onOneTimeAddress(data)` call site.

The derived schema covers:

- `recipientName`: required
- `phoneNumber`: required, Taiwan mobile format
- `zipCode`: required, min 3 characters
- `county`: required (min 2)
- `district`: required (min 2)
- `streetAddress`: required, min 5 characters

Errors display inline beneath each field. Note: the existing schema uses "請選擇縣市" / "請選擇行政區" for `county`/`district` error messages — since these are plain text inputs (not dropdowns), the wording is slightly misleading but acceptable. No change required.

## Form Layout

Match the existing `AddressForm` layout exactly:
- Single column: recipientName → phoneNumber → zipCode
- county + district in a two-column grid (`grid grid-cols-2 gap-4`)
- streetAddress full-width
- Confirm button (「確認」) at the bottom right
- No `isDefault` checkbox (omitted — one-time address cannot be set as default)

---

## UX — Dialog Reopen Behavior

When a user has previously set a one-time address and reopens the Dialog:
- Users with saved addresses: Dialog opens on `選擇地址` tab, form is empty.
- Users without saved addresses: Dialog opens on `填寫地址` tab, form is empty.

The one-time address form does not persist or pre-populate on reopen. If the user dismisses the Dialog without submitting the form, `selectedAddress` retains its previous value (either the prior saved/temp address or null).

---

## Out of Scope

- Saving the one-time address to the user's account
- County/district dropdowns (plain text input is sufficient)
- Any changes to the order API
