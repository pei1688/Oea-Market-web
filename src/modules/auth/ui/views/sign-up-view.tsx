"use client";
import Link from "next/link";
import * as Card from "@/components/ui/card";
import RegisterForm from "../../components/register-form";

const SignUpView = () => {
  return (
    <Card.Card className="w-full border-transparent bg-transparent shadow-none md:w-1/2">
      <Card.CardContent className="space-y-6">
        <div className="text-center">
          <h1 className="ae-home-title mb-2">建立你的帳號</h1>
          <h2 className="ae-home-subTitle">成為會員不定時享有優惠</h2>
        </div>
        <RegisterForm />
        <div className="ae-caption text-center">
          已經有帳戶嗎?{" "}
          <Link
            href={"/sign-in"}
            className="text-fuchsia-700 duration-300 hover:text-fuchsia-500 hover:underline"
          >
            登入
          </Link>
        </div>
      </Card.CardContent>
    </Card.Card>
  );
};

export default SignUpView;
