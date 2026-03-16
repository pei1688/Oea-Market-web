import { Ellipsis } from "lucide-react";

const Spinner = () => {
  return (
    <div className="flex h-[80%] items-center justify-center">
      <Ellipsis className="animate-caret-blink mt-16 size-18 text-[#B83280]" />
    </div>
  );
};

export { Spinner };
export default Spinner;
