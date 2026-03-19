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
