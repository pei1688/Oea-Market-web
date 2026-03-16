import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(3, { message: "名稱不能少於三個字元" }).optional(),
  phoneNumber: z.string().optional(),
  email: z.string(),
  gender: z.string().optional(),
  birthday: z
    .date()
    .min(new Date("1900-01-01"), { message: "請選擇合理的出生年" })
    .max(new Date(), { message: "生日不能是未來的日期" })
    .optional(),
});

export const updateUserActionSchema = z.object({
  name: z.string().min(3, { message: "名稱不能少於三個字元" }).optional(),
  phoneNumber: z.string().optional(),
  gender: z.string().optional(),
  birthday: z.string().optional(),
});
