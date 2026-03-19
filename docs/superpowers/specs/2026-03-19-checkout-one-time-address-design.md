# Checkout One-Time Address Entry — Design Spec

**Date:** 2026-03-19
**Status:** Approved

## Overview

Allow users to fill in a one-time shipping address during checkout, in addition to selecting from their saved addresses. The address is used only for the current order and is not saved to the account.

---

## Data & Types

A new interface `OneTimeAddressData` is introduced:

```ts
interface OneTimeAddressData {
  recipientName: string;
  phoneNumber: string;
  zipCode: string;
  county: string;
  district: string;
  streetAddress: string;
}
```

When the user submits a one-time address, `useCheckout` assembles a temporary `Address`-shaped object:

```ts
const tempAddress: Address = {
  id: "temp",
  isDefault: false,
  ...data,
  // any remaining required Prisma Address fields set to sensible defaults
}
```

`selectedAddress` remains typed as `Address | null` — no type changes propagate to `OrderInfo`, `CheckOutContent`, `AddressDisplay`, or the order API.

---

## Component Changes

### `AddressSelector`

- Wrap Dialog content with `Tabs` (shadcn/ui), two tabs:
  - **選擇地址** — existing RadioGroup, unchanged
  - **填寫地址** — new form
- Default active tab: `選擇地址` if `profile.Address` is non-empty; `填寫地址` if empty
- New prop added:
  ```ts
  onOneTimeAddress: (data: OneTimeAddressData) => void
  ```
- Form built with `react-hook-form` + `zod`
- On valid submit: call `onOneTimeAddress(data)`, Dialog closes

### `OrderInfo`

- Thread new prop down:
  ```ts
  onOneTimeAddress: (data: OneTimeAddressData) => void
  ```

### `CheckOutContent`

- Thread new prop down from `useCheckout`:
  ```ts
  onOneTimeAddress={handleOneTimeAddress}
  ```

### `useCheckout`

- New handler:
  ```ts
  const handleOneTimeAddress = (data: OneTimeAddressData) => {
    const tempAddress: Address = { id: "temp", isDefault: false, ...data }
    setSelectedAddress(tempAddress)
    setIsAddressDialogOpen(false)
  }
  ```
- Exported from hook return value

### `AddressDisplay`

- No changes required. `isDefault: false` on a temp address means the 預設 badge won't appear — correct behavior.

---

## Form Validation (Zod Schema)

| Field | Rule |
|---|---|
| recipientName | Required |
| phoneNumber | Required, format: `09xxxxxxxx` (Taiwan mobile) |
| zipCode | Required, 3-digit number |
| county | Required |
| district | Required |
| streetAddress | Required |

Errors display inline beneath each field (no toast).

---

## Out of Scope

- Saving the one-time address to the user's account
- County/district dropdowns (plain text input is sufficient)
- Any changes to the order API
