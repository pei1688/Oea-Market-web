"use client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/form/form-input";
import { OctagonAlertIcon } from "lucide-react";
import Social from "./social";

const registerFormSchema = z
  .object({
    name: z.string().min(2).max(10),
    email: z.string().email({ message: "請輸入電子信箱" }),
    password: z.string().min(1, { message: "請輸入密碼" }),
    confirmPassword: z.string().min(1, { message: "請再次輸入密碼" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "密碼輸入不一致",
    path: ["confirmPassword"],
  });

const RegisterForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<boolean | false>(false);
  const form = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const onSubmit = async (data: z.infer<typeof registerFormSchema>) => {
    setError(null);
    setPending(true);
    authClient.signUp.email(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          setPending(false);
        },
        onError: ({ error }) => {
          setPending(false);
          setError(error.message);
        },
      },
    );
  };

  const onSocial = async (provider: "facebook" | "google") => {
    setError(null);
    setPending(true);
    authClient.signIn.social(
      {
        provider: provider,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          setPending(false);
        },
        onError: ({ error }) => {
          setPending(false);
          setError(error.message);
        },
      },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormInput name="name" control={form.control} placeholder="名稱" />
        <FormInput
          type="email"
          name="email"
          control={form.control}
          placeholder="電子信箱"
        />
        <FormInput
          type="password"
          name="password"
          control={form.control}
          placeholder="密碼"
        />
        <FormInput
          type="password"
          name="confirmPassword"
          control={form.control}
          placeholder="確認密碼"
        />
        {!!error && (
          <div className="bg-destructive/10 flex items-center gap-2 rounded-md p-3">
            <OctagonAlertIcon className="text-destructive size-4" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}
        <Button className="w-full" disabled={pending} variant={"default"}>
          註冊
        </Button>
        <div className="relative text-center text-sm after:absolute after:top-1/2 after:left-0 after:z-0 after:h-px after:w-full after:border-t after:border-neutral-700">
          <span className="text-muted-foreground relative z-10 bg-neutral-100 px-2">
            or
          </span>
        </div>
        <Social pending={pending} onSocial={onSocial} />
      </form>
    </Form>
  );
};

export default RegisterForm;
