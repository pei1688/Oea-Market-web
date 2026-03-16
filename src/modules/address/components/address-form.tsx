"use client";
import { createAddressSchema } from "@/schema/address/create";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import FormInput from "@/components/form/form-input";

type Address = {
  id: string;
  recipientName: string;
  phoneNumber: string;
  zipCode: string;
  county: string;
  district: string;
  streetAddress: string;
  isDefault: boolean;
};

interface AddressFormProps {
  onSubmit: (data: z.infer<typeof createAddressSchema>) => void;
  onCancel: () => void;
  pending: boolean;
  initialData?: Address | null;
}

const AddressForm = ({
  onSubmit,
  onCancel,
  pending = false,
  initialData = null,
}: AddressFormProps) => {
  const form = useForm({
    resolver: zodResolver(createAddressSchema),
    defaultValues: {
      recipientName: initialData?.recipientName || "",
      phoneNumber: initialData?.phoneNumber || "",
      zipCode: initialData?.zipCode || "",
      county: initialData?.county || "",
      district: initialData?.district || "",
      streetAddress: initialData?.streetAddress || "",
      isDefault: initialData?.isDefault || false,
    },
  });

  const handleSubmit = async (data: z.infer<typeof createAddressSchema>) => {
    await onSubmit(data);
    // 只有在新增模式下才重置表單
    if (!initialData) {
      form.reset();
    }
  };

  const isEditMode = !!initialData;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormInput
          control={form.control}
          name="recipientName"
          placeholder="請輸入聯絡人名稱"
          label="名稱"
        />
        <FormInput
          control={form.control}
          name="phoneNumber"
          placeholder="請輸入聯絡電話"
          label="聯絡人電話"
        />
        <FormInput
          control={form.control}
          name="zipCode"
          placeholder="請輸入郵遞區號"
          label="郵遞區號"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            control={form.control}
            name="county"
            placeholder="請輸入縣市"
            label="縣市"
          />
          <FormInput
            control={form.control}
            name="district"
            placeholder="請輸入區域"
            label="區域"
          />
        </div>
        <FormInput
          control={form.control}
          name="streetAddress"
          placeholder="請輸入詳細地址"
          label="詳細地址"
        />
        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 space-x-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>設為預設地址</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button type="submit" disabled={pending}>
            {pending
              ? isEditMode
                ? "更新中..."
                : "新增中..."
              : isEditMode
                ? "更新地址"
                : "新增地址"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddressForm;
