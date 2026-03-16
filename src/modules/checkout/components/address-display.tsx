"use client";

import { Address } from "@prisma/client";

interface AddressDisplayProps {
  address: Address | null;
  hasAddresses: boolean;
}

const formatFullAddress = (address: Address) =>
  `${address.zipCode} ${address.county}${address.district}${address.streetAddress}`;

export const AddressDisplay = ({
  address,
  hasAddresses,
}: AddressDisplayProps) => {
  if (!address && !hasAddresses) {
    return <div className="text-destructive text-sm">尚未設定送貨資訊</div>;
  }

  if (!address) return null;

  return (
    <div className="space-y-3 rounded bg-neutral-200 p-3 text-sm font-semibold">
      <div className="font-medium text-neutral-600">
        {address.recipientName}
        {address.isDefault && (
          <span className="ml-2 rounded bg-[#b832801f] px-1.5 py-0.5 text-xs text-[#B83280]">
            預設
          </span>
        )}
      </div>
      <div className="text-neutral-600">{address.phoneNumber}</div>
      <div className="text-neutral-600">{formatFullAddress(address)}</div>
    </div>
  );
};
