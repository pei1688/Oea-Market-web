"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Address } from "@prisma/client";

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddress: Address | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddressSelect: (addressId: string) => void;
}

const formatFullAddress = (address: Address) =>
  `${address.zipCode} ${address.county}${address.district}${address.streetAddress}`;

export const AddressSelector = ({
  addresses,
  selectedAddress,
  isOpen,
  onOpenChange,
  onAddressSelect,
}: AddressSelectorProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogTrigger asChild>
      <Button variant="link" className="text-[#9F2B6D]" size="sm">
        變更
      </Button>
    </DialogTrigger>
    <DialogContent className="top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-sm bg-neutral-200 p-4">
      <DialogHeader>
        <DialogTitle>選擇送貨地址</DialogTitle>
        <DialogDescription>請選擇您要使用的送貨地址</DialogDescription>
      </DialogHeader>
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
                      <span className="rounded bg-[#b832801f] px-1.5 py-0.5 text-xs text-[#B83280]">
                        預設
                      </span>
                    )}
                  </div>
                  <p className="text-sm break-words text-neutral-600">
                    {address.phoneNumber}
                  </p>
                  <p className="text-sm break-words text-neutral-600">
                    {formatFullAddress(address)}
                  </p>
                </Label>
              </div>
            </div>
          </div>
        ))}
      </RadioGroup>
    </DialogContent>
  </Dialog>
);
