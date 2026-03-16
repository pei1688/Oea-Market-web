import { z } from "zod";

export const createAddressSchema = z.object({
  recipientName: z.string().min(1, { message: "請輸入收件人姓名" }),

  phoneNumber: z
    .string()
    .regex(/^09\d{8}$/, { message: "請輸入有效的台灣手機號碼（共10碼）" }),

  zipCode: z.string().min(3, { message: "請輸入有效的郵遞區號" }),

  county: z.string().min(2, { message: "請選擇縣市" }),

  district: z.string().min(2, { message: "請選擇行政區" }),

  streetAddress: z.string().min(5, { message: "請輸入完整街道地址" }),

  isDefault: z.boolean().optional(), // 可選，預設 false
});
