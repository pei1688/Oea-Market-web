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
    return <div className="text-sm text-fuchsia-600">尚未設定送貨資訊</div>;
  }

  if (!address) return null;

  return (
    <div className="space-y-3 rounded bg-neutral-200 p-3 text-sm font-semibold">
      <div className="flex gap-2 font-medium text-neutral-600">
        {address.isDefault && (
          <span className="rounded bg-fuchsia-800 px-1.5 py-0.5 text-xs text-fuchsia-100">
            預設
          </span>
        )}
        <p>{address.recipientName}</p>
      </div>
      <div className="text-neutral-600">{address.phoneNumber}</div>
      <div className="text-neutral-600">{formatFullAddress(address)}</div>
    </div>
  );
};
