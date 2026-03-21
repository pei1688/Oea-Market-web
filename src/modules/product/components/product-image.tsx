"use client";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ImagePreview from "./image-prview";

interface ProductImageProps {
  image: string;
  images: string[];
  name: string;
  onImageChange?: (image: string) => void;
}

const ProductImage = ({
  image,
  images,
  name,
  onImageChange,
}: ProductImageProps) => {
  const handleImageChange = (newImage: string) => {
    if (onImageChange) {
      onImageChange(newImage);
    }
  };

  return (
    <div className="col-span-2 flex flex-col items-center">
      {/* 大圖片區域 */}
      <Dialog>
        <DialogTrigger className="product-gallery relative h-auto w-full">
          <Image
            src={image || "/default-product.png"}
            alt={name}
            className="cursor-pointer rounded-sm object-cover transition-opacity hover:opacity-90"
            fill
          />
        </DialogTrigger>
        <DialogContent className="h-screen w-screen max-w-md border-transparent bg-transparent p-0 shadow-transparent">
          <DialogHeader className="absolute">
            <DialogTitle />
          </DialogHeader>

          {/* 使用獨立的畫廊組件 */}
          <ImagePreview
            images={images}
            currentImage={image}
            name={name}
            onSelectImage={handleImageChange}
          />
        </DialogContent>
      </Dialog>

      {/* 縮略圖區域 - 只影響預覽圖 */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto">
        {images.map((img, index) => (
          <div key={index} className="relative h-16 w-16 shrink-0">
            <Image
              src={img || "/default-product.png"}
              alt={`${name} - 圖片 ${index + 1}`}
              className={`cursor-pointer rounded-sm border-2 object-cover transition ${
                image === img
                  ? "border-neutral-700"
                  : "border-transparent hover:border-neutral-700/30"
              }`}
              onClick={() => handleImageChange(img)}
              fill
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductImage;
