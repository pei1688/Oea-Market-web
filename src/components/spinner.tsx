import { Ellipsis } from "lucide-react";

const Spinner = () => {
  return (
    <div className="flex h-[80%] items-center justify-center">
      <Ellipsis className="animate-caret-blink mt-16 text-[#B83280] sm:size-6 md:size-12 lg:size-18" />
    </div>
  );
};

export { Spinner };
export default Spinner;
