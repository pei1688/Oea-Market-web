"use client";
import FormInput from "@/components/form/form-input";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { OctagonAlertIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Social from "./social";
import { toast } from "sonner";

const loginFormSchema = z.object({
  email: z.string().email({ message: "請輸入電子信箱" }),
  password: z.string().min(1, { message: "請輸入密碼" }),
});
const LoginForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<boolean | false>(false);
  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof loginFormSchema>) => {
    setError(null);
    setPending(true);
    authClient.signIn.email(
      {
        email: data.email,
        password: data.password,
        callbackURL: "/",
      },
      {
        onSuccess: () => {
          setPending(false);
        },
        onError: ({ error }: { error: Error }) => {
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
        onError: ({ error }: { error: Error }) => {
          setPending(false);
          setError(error.message);
        },
      },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full">
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
        {!!error && (
          <div className="bg-destructive/10 flex items-center gap-2 rounded-md p-3">
            <OctagonAlertIcon className="text-destructive size-4" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}
        <Button variant={"default"} className="w-full" disabled={pending}>
          登入
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

export default LoginForm;
