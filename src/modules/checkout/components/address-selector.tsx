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
import { useState } from "react";
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
  const [activeTab, setActiveTab] = useState<"saved" | "new">(
    addresses.length > 0 ? "saved" : "new",
  );

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
    } else {
      setActiveTab(addresses.length > 0 ? "saved" : "new");
    }
    onOpenChange(open);
  };

  const handleOneTimeSubmit = (data: OneTimeFormValues) => {
    onOneTimeAddress(data);
    handleDialogOpenChange(false);
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
        <DialogContent className="top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-sm bg-neutral-100 p-4">
          <DialogHeader>
            <DialogTitle>送貨資訊</DialogTitle>
            <DialogDescription asChild>
              <VisuallyHidden.Root>
                請選擇已儲存的地址或填寫一次性地址
              </VisuallyHidden.Root>
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "saved" | "new")}
          >
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="saved" className="flex-1">
                選擇地址
              </TabsTrigger>
              <TabsTrigger value="new" className="flex-1">
                填寫地址
              </TabsTrigger>
            </TabsList>

            <TabsContent value="saved">
              {addresses.length === 0 ? (
                <div className="py-6 text-center text-sm text-neutral-500">
                  尚未建立任何地址。
                  <a
                    href="/account/address"
                    className="ml-1 text-fuchsia-600 hover:underline"
                  >
                    前往建立地址
                  </a>
                </div>
              ) : (
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
                          <Label
                            htmlFor={address.id}
                            className="block cursor-pointer"
                          >
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
              )}
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
                          <Input
                            placeholder="請輸入聯絡人名稱"
                            {...field}
                            className="border-primary/50 border"
                          />
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
                          <Input
                            placeholder="請輸入聯絡電話"
                            {...field}
                            className="border-primary/50 border"
                          />
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
                          <Input
                            placeholder="請輸入郵遞區號"
                            {...field}
                            className="border-primary/50 border"
                          />
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
                            <Input
                              placeholder="請輸入縣市"
                              {...field}
                              className="border-primary/50 border"
                            />
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
                            <Input
                              placeholder="請輸入區域"
                              {...field}
                              className="border-primary/50 border"
                            />
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
                          <Input
                            placeholder="請輸入詳細地址"
                            {...field}
                            className="border-primary/50 border"
                          />
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
