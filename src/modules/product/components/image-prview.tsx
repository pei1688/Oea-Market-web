"use client";

import Image from "next/image";

const ImagePreview = ({
  images,
  currentImage,
  name,
  onSelectImage,
}: {
  images: string[];
  currentImage: string;
  name: string;
  onSelectImage: (img: string) => void;
}) => {
  return (
    <div className="relative h-full w-full">
      <div className="flex h-full items-center justify-center">
        <Image
          src={currentImage || "/default-product.png"}
          alt={name}
          className="object-contain"
          fill
        />
      </div>

      <div className="absolute right-0 bottom-4 left-0 flex justify-center gap-2">
        {images.map((img) => (
          <button
            key={img}
            className={`h-12 w-12 rounded border-2 transition ${
              currentImage === img
                ? "border-fuchsia-500"
                : "border-transparent hover:border-fuchsia-500/30"
            }`}
            onClick={() => onSelectImage(img)}
          >
            <Image
              src={img}
              alt={`${name} 縮圖`}
              className="h-full w-full object-cover"
              width={48}
              height={48}
              quality={60}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
export default ImagePreview;
