# Checkout One-Time Address Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "填寫地址" tab inside the checkout address Dialog so users can enter a one-time shipping address without it being saved to their account.

**Architecture:** A new `handleOneTimeAddress` handler in `useCheckout` assembles a temporary `Address`-shaped object and sets it as `selectedAddress`. `AddressSelector` is refactored to a function-body component, gains a Tabs UI (shadcn/ui), and a form using the existing `createAddressSchema`. Props are threaded down through `OrderInfo` and `CheckOutContent`.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Prisma (type source only), react-hook-form, zod, shadcn/ui (Tabs, Dialog), @radix-ui/react-visually-hidden

---

## File Map

| File | Change |
|---|---|
| `src/components/ui/tabs.tsx` | **Create** — new shadcn Tabs component (via CLI) |
| `src/types/checkout.ts` | **Modify** — add `OneTimeAddressData` interface |
| `src/hooks/use-checkout.ts` | **Modify** — add `handleOneTimeAddress` handler |
| `src/modules/checkout/components/address-selector.tsx` | **Modify** — refactor to function-body, add Tabs + one-time form |
| `src/modules/checkout/components/order-info.tsx` | **Modify** — thread `onOneTimeAddress` prop |
| `src/modules/checkout/ui/views/check-out-content.tsx` | **Modify** — thread `onOneTimeAddress` prop |

---

## Task 1: Install Tabs and add `OneTimeAddressData` type

**Files:**
- Create: `src/components/ui/tabs.tsx` (via CLI)
- Modify: `src/types/checkout.ts`

- [ ] **Step 1: Install the shadcn Tabs component**

```bash
npx shadcn@latest add tabs
```

Expected: `src/components/ui/tabs.tsx` is created. No other files should change.

- [ ] **Step 2: Verify the npm package and file were installed**

```bash
node -e "require('@radix-ui/react-tabs'); console.log('OK')"
```

Expected: prints `OK`. If this fails, run `npm install @radix-ui/react-tabs` manually before proceeding.

```bash
ls src/components/ui/tabs.tsx
```

Expected: file path printed, no error.

- [ ] **Step 3: Add `OneTimeAddressData` to `src/types/checkout.ts`**

Current file contents:
```ts
import { Address, Profile } from "@prisma/client";

export interface ProfileWithAddress extends Profile {
  Address: Address[];
}

export interface CartContentProps {
  profile: ProfileWithAddress;
}
```

Replace with:
```ts
import { Address, Profile } from "@prisma/client";

export interface ProfileWithAddress extends Profile {
  Address: Address[];
}

export interface CartContentProps {
  profile: ProfileWithAddress;
}

export interface OneTimeAddressData {
  recipientName: string;
  phoneNumber: string;
  zipCode: string;
  county: string;
  district: string;
  streetAddress: string;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/tabs.tsx src/types/checkout.ts
git commit -m "feat: add Tabs component and OneTimeAddressData type"
```

---

## Task 2: Add `handleOneTimeAddress` to `useCheckout`

**Files:**
- Modify: `src/hooks/use-checkout.ts`

- [ ] **Step 1: Add import for `OneTimeAddressData` and update the hook**

Open `src/hooks/use-checkout.ts`. Make two changes:

**Change 1 — add import** (line 7, after existing imports):
```ts
import { ProfileWithAddress, OneTimeAddressData } from "@/types/checkout";
```
(Replace the existing `ProfileWithAddress` import with the updated import that also includes `OneTimeAddressData`.)

**Change 2 — add handler** (after `handleAddressSelect`, before `handleCODOrder`):
```ts
const handleOneTimeAddress = (data: OneTimeAddressData) => {
  const tempAddress: Address = {
    id: "temp",
    isDefault: false,
    profileId: profile.id,
    ...data,
  };
  setSelectedAddress(tempAddress);
};
```

**Change 3 — export from return value** (add `handleOneTimeAddress` to the return object):
```ts
return {
  checkoutItems,
  checkoutTotalItems,
  checkoutTotalPrice,
  selectedAddress,
  isAddressDialogOpen,
  setIsAddressDialogOpen,
  handleQuantityChange,
  handleBackToCart,
  handlePlaceOrder,
  handleAddressSelect,
  handleOneTimeAddress,   // <-- add this
  handleOnlinePayment,
  handleCODOrder,
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-checkout.ts
git commit -m "feat: add handleOneTimeAddress handler to useCheckout"
```

---

## Task 3: Refactor `AddressSelector` with Tabs and one-time form

**Files:**
- Modify: `src/modules/checkout/components/address-selector.tsx`

- [ ] **Step 1: Replace the entire file contents**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Address } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createAddressSchema } from "@/schema/address/create";
import { OneTimeAddressData } from "@/types/checkout";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

const oneTimeSchema = createAddressSchema.omit({ isDefault: true });
type OneTimeFormValues = z.infer<typeof oneTimeSchema>;

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddress: Address | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddressSelect: (addressId: string) => void;
  onOneTimeAddress: (data: OneTimeAddressData) => void;
}

const formatFullAddress = (address: Address) =>
  `${address.zipCode} ${address.county}${address.district}${address.streetAddress}`;

export const AddressSelector = ({
  addresses,
  selectedAddress,
  isOpen,
  onOpenChange,
  onAddressSelect,
  onOneTimeAddress,
}: AddressSelectorProps) => {
  const defaultTab = addresses.length > 0 ? "saved" : "new";

  const form = useForm<OneTimeFormValues>({
    resolver: zodResolver(oneTimeSchema),
    defaultValues: {
      recipientName: "",
      phoneNumber: "",
      zipCode: "",
      county: "",
      district: "",
      streetAddress: "",
    },
  });

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  };

  const handleOneTimeSubmit = (data: OneTimeFormValues) => {
    onOneTimeAddress(data);
    onOpenChange(false);
  };

  return (
    <>
      <Button
        variant="link"
        className="text-fuchsia-600"
        size="sm"
        onClick={() => onOpenChange(true)}
      >
        變更
      </Button>
      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-sm bg-neutral-200 p-4">
        <DialogHeader>
          <DialogTitle>送貨資訊</DialogTitle>
          <DialogDescription asChild>
            <VisuallyHidden.Root>請選擇已儲存的地址或填寫一次性地址</VisuallyHidden.Root>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="saved" className="flex-1" disabled={addresses.length === 0}>
              選擇地址
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-1">
              填寫地址
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved">
            <RadioGroup
              value={selectedAddress?.id || ""}
              onValueChange={onAddressSelect}
              className="space-y-4"
            >
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="hover:border-primary flex flex-col rounded-lg border p-4 transition sm:flex-row sm:items-start sm:space-x-4"
                >
                  <div className="mb-2 flex gap-2 sm:mt-1 sm:mb-0">
                    <RadioGroupItem
                      value={address.id}
                      id={address.id}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={address.id} className="block cursor-pointer">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-medium">
                            {address.recipientName}
                          </span>
                          {address.isDefault && (
                            <span className="rounded bg-fuchsia-800 px-1.5 py-0.5 text-xs text-fuchsia-600">
                              預設
                            </span>
                          )}
                        </div>
                        <p className="text-sm wrap-break-word text-neutral-600">
                          {address.phoneNumber}
                        </p>
                        <p className="text-sm wrap-break-word text-neutral-600">
                          {formatFullAddress(address)}
                        </p>
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </TabsContent>

          <TabsContent value="new">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleOneTimeSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="recipientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>名稱</FormLabel>
                      <FormControl>
                        <Input placeholder="請輸入聯絡人名稱" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>聯絡人電話</FormLabel>
                      <FormControl>
                        <Input placeholder="請輸入聯絡電話" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>郵遞區號</FormLabel>
                      <FormControl>
                        <Input placeholder="請輸入郵遞區號" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="county"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>縣市</FormLabel>
                        <FormControl>
                          <Input placeholder="請輸入縣市" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>區域</FormLabel>
                        <FormControl>
                          <Input placeholder="請輸入區域" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="streetAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>詳細地址</FormLabel>
                      <FormControl>
                        <Input placeholder="請輸入詳細地址" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-2">
                  <Button type="submit">確認</Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
      </Dialog>
    </>
  );
};
```

> **Note:** The Button is rendered outside the `Dialog` using a Fragment (`<>...</>`). This is the correct Radix UI pattern for a fully controlled Dialog — the trigger button is unrelated to Dialog's internal state wiring and simply calls `onOpenChange(true)`. The original `<DialogTrigger asChild>` pattern has been intentionally removed.
>
> **Note on Dialog close:** When a saved address is selected, `handleAddressSelect` in `useCheckout` closes the Dialog by calling `setIsAddressDialogOpen(false)` directly. When a one-time address is submitted, `AddressSelector` closes the Dialog by calling `onOpenChange(false)` itself (before handing data to `handleOneTimeAddress`). These are two different close paths — both work correctly because `isAddressDialogOpen` state is the single source of truth.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/modules/checkout/components/address-selector.tsx
git commit -m "feat: add one-time address tab to AddressSelector"
```

---

## Task 4: Thread `onOneTimeAddress` through `OrderInfo` and `CheckOutContent`

**Files:**
- Modify: `src/modules/checkout/components/order-info.tsx`
- Modify: `src/modules/checkout/ui/views/check-out-content.tsx`

- [ ] **Step 1: Update `OrderInfo` props and pass through**

In `src/modules/checkout/components/order-info.tsx`:

**Add import** at top:
```ts
import { OneTimeAddressData } from "@/types/checkout";
```

**Add to `OrderInfoProps` interface** (after `onAddressSelect`):
```ts
onOneTimeAddress: (data: OneTimeAddressData) => void;
```

**Add to destructured props** (after `onAddressSelect`):
```ts
onOneTimeAddress,
```

**Pass to `AddressSelector`** (add alongside existing props):
```tsx
<AddressSelector
  addresses={profile.Address}
  selectedAddress={selectedAddress}
  isOpen={isAddressDialogOpen}
  onOpenChange={onAddressDialogChange}
  onAddressSelect={onAddressSelect}
  onOneTimeAddress={onOneTimeAddress}   // <-- add this line
/>
```

- [ ] **Step 2: Update `CheckOutContent` to supply `onOneTimeAddress`**

In `src/modules/checkout/ui/views/check-out-content.tsx`:

**Add `handleOneTimeAddress` to destructure from `useCheckout`**:
```ts
const {
  checkoutItems,
  checkoutTotalItems,
  checkoutTotalPrice,
  selectedAddress,
  isAddressDialogOpen,
  setIsAddressDialogOpen,
  handleQuantityChange,
  handleBackToCart,
  handleAddressSelect,
  handleOneTimeAddress,   // <-- add this
  handleOnlinePayment,
  handleCODOrder,
} = useCheckout(profile);
```

**Pass to `OrderInfo`**:
```tsx
<OrderInfo
  profile={profile}
  selectedAddress={selectedAddress}
  totalItems={checkoutTotalItems}
  totalPrice={checkoutTotalPrice}
  isAddressDialogOpen={isAddressDialogOpen}
  onAddressDialogChange={setIsAddressDialogOpen}
  onAddressSelect={handleAddressSelect}
  onOneTimeAddress={handleOneTimeAddress}   // <-- add this line
  onPlaceOrder={handlePayment}
  paymentMethod={paymentMethod}
  onPaymentMethodChange={setPaymentMethod}
  isProcessing={isProcessing}
/>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Build to confirm no runtime errors**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/modules/checkout/components/order-info.tsx src/modules/checkout/ui/views/check-out-content.tsx
git commit -m "feat: wire onOneTimeAddress prop through OrderInfo and CheckOutContent"
```

---

## Task 5: Manual verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test with existing saved addresses**

1. Log in as a user who has saved addresses
2. Add item to cart → proceed to checkout
3. Click "變更" — Dialog opens
4. Confirm "選擇地址" tab is the default
5. Switch to "填寫地址" tab — empty form appears
6. Submit the form with invalid data — inline errors appear under each field
7. Fill in valid data → click "確認"
8. Dialog closes, `AddressDisplay` shows the entered address (no 預設 badge)
9. Click "確認下單" / "前往付款" — order proceeds normally

- [ ] **Step 3: Test with no saved addresses**

1. Log in as a user with zero saved addresses
2. Add item to cart → proceed to checkout
3. Click "變更" — Dialog opens directly on "填寫地址" tab
4. "選擇地址" tab is disabled
5. Fill in valid data → click "確認"
6. Dialog closes, address displays correctly
7. Order can be placed

- [ ] **Step 4: Test Dialog reset behavior**

1. Open Dialog, switch to "填寫地址", type some text in a field
2. Close Dialog without submitting
3. Re-open Dialog — form is empty (reset)

- [ ] **Step 5: Final commit if any fixes were applied**

```bash
git add -A
git commit -m "fix: address any issues found during manual verification"
```
