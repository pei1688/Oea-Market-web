"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Address } from "@prisma/client";
import { AddressSelector } from "./address-selector";
import { AddressDisplay } from "./address-display";
import { ProfileWithAddress } from "@/types/checkout";
import { Loader2 } from "lucide-react";

interface OrderInfoProps {
  profile: ProfileWithAddress;
  selectedAddress: Address | null;
  totalItems: number;
  totalPrice: number;
  isAddressDialogOpen: boolean;
  onAddressDialogChange: (open: boolean) => void;
  onAddressSelect: (addressId: string) => void;
  onPlaceOrder: (paymentMethod: "cod" | "online") => void;
  paymentMethod: "cod" | "online";
  onPaymentMethodChange: (method: "cod" | "online") => void;
  isProcessing?: boolean;
}

export const OrderInfo = ({
  profile,
  selectedAddress,
  totalItems,
  totalPrice,
  isAddressDialogOpen,
  onAddressDialogChange,
  onAddressSelect,
  onPlaceOrder,
  paymentMethod,
  onPaymentMethodChange,
  isProcessing = false,
}: OrderInfoProps) => (
  <div className="lg:col-span-1">
    <div className="sticky top-4 rounded-lg bg-neutral-200/50 p-6">
      <h2 className="ae-checkout-subTitle mb-4">個人資訊</h2>
      <div className="space-y-6">
        <div className="flex justify-between">
          <span>購買人</span>
          <span>{profile.name}</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>送貨資訊</span>
            <AddressSelector
              addresses={profile.Address}
              selectedAddress={selectedAddress}
              isOpen={isAddressDialogOpen}
              onOpenChange={onAddressDialogChange}
              onAddressSelect={onAddressSelect}
            />
          </div>
          <AddressDisplay
            address={selectedAddress}
            hasAddresses={profile.Address.length > 0}
          />
        </div>
      </div>

      <Separator className="bg-primary/20 my-4" />

      <h2 className="ae-checkout-subTitle mb-4">付款方式</h2>
      <div className="mb-4">
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) =>
            onPaymentMethodChange(value as "cod" | "online")
          }
          className="space-y-3"
          disabled={isProcessing}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cod" id="cod" />
            <Label htmlFor="cod" className="cursor-pointer">
              取貨付款
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="online" id="online" />
            <Label htmlFor="online" className="cursor-pointer">
              線上付款
            </Label>
          </div>
        </RadioGroup>

        {paymentMethod === "cod" && (
          <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3">
            <p className="text-sm text-orange-800">
              選擇取貨付款，商品送達時再進行付款
            </p>
          </div>
        )}

        {paymentMethod === "online" && (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              選擇線上付款將使用 Stripe 安全付款系統處理您的訂單
            </p>
          </div>
        )}
      </div>

      <Separator className="bg-primary/20 my-4" />

      <h2 className="ae-checkout-subTitle mb-4">訂單摘要</h2>
      <div className="mb-4 space-y-6">
        <div className="flex justify-between">
          <span>商品數量</span>
          <span>{totalItems} 件</span>
        </div>
        <div className="flex justify-between">
          <span>商品總計</span>
          <span>NT$ {totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>運費</span>
          <span>NT$ 0</span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-semibold">
          <span>總計</span>
          <span>NT$ {totalPrice.toLocaleString()}</span>
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={() => onPlaceOrder(paymentMethod)}
        disabled={!selectedAddress || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            處理中...
          </>
        ) : paymentMethod === "online" ? (
          "前往付款"
        ) : (
          "確認下單"
        )}
      </Button>

      {!selectedAddress && (
        <p className="text-destructive mt-2 text-center text-xs">
          請選擇送貨地址後再下單
        </p>
      )}
    </div>
  </div>
);
