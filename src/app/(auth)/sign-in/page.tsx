import { loginAuth } from "@/action/user";
import SignInView from "@/modules/auth/ui/views/sign-in-view";

const LoginPage = async () => {
  await loginAuth();
  return <SignInView />;
};

export default LoginPage;
