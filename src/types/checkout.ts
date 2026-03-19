import { Address, Profile } from "@prisma/client";


export interface ProfileWithAddress extends Profile {
  Address: Address[];
}

export interface CartContentProps {
  profile: ProfileWithAddress;
}

export type OneTimeAddressData = Pick<
  Address,
  "recipientName" | "phoneNumber" | "zipCode" | "county" | "district" | "streetAddress"
>;
