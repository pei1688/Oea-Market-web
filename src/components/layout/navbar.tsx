import Image from "next/image";
import Link from "next/link";
import { getCollectionsWithCategory } from "@/action/collection";
import { NavLinks } from "./navbar-links";

const Navbar = async () => {
  const collections = await getCollectionsWithCategory();

  return (
    <header className="sticky top-0 z-50 w-full bg-neutral-100/40 shadow-sm backdrop-blur-lg supports-backdrop-filter:bg-neutral-100/40">
      <nav className="container mx-auto max-w-7xl px-3 md:px-5">
        <div className="flex h-16 items-center">
          {/* Logo*/}
          <Link
            href={"/"}
            className="flex shrink-0 cursor-pointer items-center gap-3"
          >
            <Image src={"/logo.png"} alt="OeaLogo" width={24} height={24} />
            <p className="ae-section-title hidden md:flex">Oea</p>
          </Link>

          <div className="flex-1">
            <NavLinks collections={collections} />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
