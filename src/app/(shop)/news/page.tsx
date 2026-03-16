import PageBreadcrumb from "@/components/layout/page-breadcrumb";
import NewsContents from "@/modules/news/ui/views/news-contents";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "最新消息",
};

const NewsPage = () => {
  return (
    <div className="px-6 py-8 lg:px-12">
      <div className="flex flex-col items-start gap-4">
        <PageBreadcrumb currentPageName="最新消息" />
        <h1 className="ae-home-title">公告</h1>
      </div>
      <NewsContents />
    </div>
  );
};

export default NewsPage;
