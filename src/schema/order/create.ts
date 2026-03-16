import { z } from "zod";

// CartItem Schema - 單個購物車商品的驗證
export const cartItemSchema = z.object({
  id: z.string().min(1, { message: "商品 ID 不能為空" }),
  name: z.string().min(1, { message: "商品名稱不能為空" }),
  image: z.string().url({ message: "商品圖片必須是有效的 URL" }),
  price: z.number().positive({ message: "商品價格必須大於 0" }),
  quantity: z.number().int().positive({ message: "商品數量必須是正整數" }),
  stock: z.number().int().min(0, { message: "庫存數量不能為負數" }),
  variantText: z.string().optional(), // 商品變體描述，可選
});

// 訂單建立 Schema
export const createOrderSchema = z.object({
  // 客戶資訊
  name: z
    .string()
    .min(2, { message: "姓名不能少於 2 個字元" })
    .max(50, { message: "姓名不能超過 50 個字元" })
    .optional(),

  phoneNumber: z
    .string()
    .regex(/^(09\d{8}|0\d{1,2}-?\d{6,8})$/, {
      message: "請輸入有效的電話號碼格式",
    })
    .optional(),

  address: z
    .string()
    .min(5, { message: "地址不能少於 5 個字元" })
    .max(200, { message: "地址不能超過 200 個字元" })
    .optional(),


  // 訂單備註
  notes: z.string().max(500, { message: "備註不能超過 500 個字元" }).optional(),

  // 用戶 ID（如果有登入）
  userId: z.string().optional(),

  // 購物車商品陣列
  items: z
    .array(cartItemSchema)
    .min(1, { message: "購物車不能為空" })
    .max(50, { message: "購物車商品數量不能超過 50 件" }),
});
