import { ImageLoaderProps } from "next/image";

export default function cloudinaryLoader({
  src,
  width,
  quality = 75,
}: ImageLoaderProps): string {
  // src is a full Cloudinary URL:
  // https://res.cloudinary.com/{cloud}/image/upload/v.../path.jpg
  const uploadIndex = src.indexOf("/upload/");
  if (uploadIndex === -1) return src; // passthrough for non-Cloudinary (local paths, UploadThing, etc.)

  const base = src.slice(0, uploadIndex + 8); // includes "/upload/"
  const rest = src.slice(uploadIndex + 8);

  return `${base}w_${width},q_${quality},f_auto/${rest}`;
}
