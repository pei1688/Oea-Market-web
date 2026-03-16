"use client";

import { updateUser } from "@/action/user";
import FormDatePicker from "@/components/form/form-date-picker";
import FormInput from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { updateUserSchema } from "@/schema/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UserProfileProps } from "../ui/views/user-profile-content";
import { z } from "zod";
import { genderOptions } from "@/config/constants";

const UpdateUserForm = ({ profile }: UserProfileProps) => {
  const [pending, setPending] = useState(false);
  const form = useForm({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: profile?.name || "",
      email: profile?.email,
      phoneNumber: profile?.phoneNumber || "",
      gender: profile?.gender || "",
      birthday: profile?.birthday ? new Date(profile.birthday) : undefined,
    },
  });

  const onSubmit = async (data: z.infer<typeof updateUserSchema>) => {
    setPending(true);
    if (data.name && data.name.trim() === "") {
      setPending(false);
      return null;
    }

    const formData = new FormData();
    if (data.name) {
      formData.append("name", data.name);
    }
    if (data.phoneNumber) {
      formData.append("phoneNumber", data.phoneNumber);
    }
    if (data.gender && data.gender.trim()) {
      formData.append("gender", data.gender);
    }
    if (data.birthday) {
      formData.append("birthday", data.birthday.toISOString());
    }
    try {
      const res = await updateUser(formData);
      if (res?.success) {
        toast.success(res?.message);
      }
      setPending(false);
    } catch (error) {
      console.error("更新商品失敗", error);
      setPending(false);
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-8 flex flex-col space-y-6"
      >
        <FormInput
          name="name"
          control={form.control}
          label="姓名"
          inputClass="md:w-1/2 "
        />
        <FormInput
          name="email"
          control={form.control}
          label="電子信箱"
          disabled
          inputClass="md:w-1/2"
        />
        <FormInput
          name="phoneNumber"
          control={form.control}
          label="電話"
          placeholder="0912345678"
          inputClass="md:w-1/2"
        />

        <FormSelect
          name="gender"
          control={form.control}
          label="性別"
          placeholder="請選擇性別"
          options={genderOptions}
          className="md:w-1/2"
        />
        <FormDatePicker control={form.control} name="birthday" />

        <Button className="md:w-1/2" disabled={pending}>
          {pending ? "更新中" : "更新個人資訊"}
        </Button>
      </form>
    </Form>
  );
};

export default UpdateUserForm;
