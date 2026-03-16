import { Box, Fingerprint } from "lucide-react";

export const guestMenuItems = [
  { href: "/sign-in", icon: Fingerprint, label: "個人資料" },
  { href: "/sign-in", icon: Box, label: "訂單" },
];

export const userMenuItems = [
  { href: "/account/profile", icon: Fingerprint, label: "個人資料" },
  { href: "/account/order", icon: Box, label: "訂單記錄" },
];
