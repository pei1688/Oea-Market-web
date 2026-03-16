"use client";

import Link from "next/link";
import * as Card from "@/components/ui/card";
import LoginForm from "../../components/login-form";

const SignInView = () => {
  return (
    <Card.Card className="w-full border-transparent bg-transparent shadow-none md:w-1/2">
      <Card.CardContent className="space-y-6">
        <div className="text-center">
          <h1 className="ae-home-title mb-2">歡迎回來</h1>
          <h2 className="ae-home-subTitle">管理您的帳號</h2>
        </div>
        <LoginForm />
        <div className="ae-caption text-center">
          還沒有帳戶嗎?{" "}
          <Link href={"/sign-up"} className="duration-300 hover:underline text-fuchsia-700 hover:text-fuchsia-500">
            註冊
          </Link>
        </div>
      </Card.CardContent>
    </Card.Card>
  );
};

export default SignInView;
