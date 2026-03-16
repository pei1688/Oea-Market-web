import FadeIn from "@/components/fadein";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <FadeIn>
      <div className="mt-16 flex flex-col items-center justify-center p-6 md:mt-32 md:p-10">
        <div className="flex w-full max-w-md flex-col items-center justify-center md:max-w-3xl">
          {children}
        </div>
      </div>
    </FadeIn>
  );
};

export default Layout;
