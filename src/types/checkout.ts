import { Address, Profile } from "@prisma/client";


export interface ProfileWithAddress extends Profile {
  Address: Address[];
}

export interface CartContentProps {
  profile: ProfileWithAddress;
}
