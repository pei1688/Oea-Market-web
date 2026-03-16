"use client";
import Image from "next/image";

interface ProductDialogImageProps {
  imageUrl: string;
  altText: string;
}

export const ProductDialogImage = ({
  imageUrl,
  altText,
}: ProductDialogImageProps) => {
  return (
    <div className="relative h-96 w-full">
      <Image
        src={imageUrl}
        alt={altText}
        className="rounded-md object-cover"
        fill
        loading="lazy"
        quality={80}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
};
