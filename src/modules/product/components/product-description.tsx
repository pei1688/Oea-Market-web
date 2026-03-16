"use client";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill-new");
    return RQ;
  },
  {
    ssr: false,
    loading: () => (
      <div className="text-primary/70 min-h-[200px] animate-pulse rounded border p-3 text-sm">
        載入商品描述...
      </div>
    ),
  },
);
interface ProductDesProps {
  description: string;
}

const ProductDescription = ({ description }: ProductDesProps) => {
  return (
    <div className="mb-32 flex flex-col px-0 sm:px-4">
      <div className="ae-section-title mb-8">商品資訊</div>
      {/*商品描述*/}
      <div className="ae-body [&_.ql-container]:!border-none [&_.ql-editor]:!p-0 [&_.ql-toolbar]:hidden">
        <ReactQuill
          theme="snow"
          value={description}
          readOnly={true}
          modules={{
            toolbar: false,
          }}
        />
      </div>
    </div>
  );
};

export default ProductDescription;
