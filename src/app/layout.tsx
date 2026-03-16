import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import { Toaster } from "sonner";
import Footer from "@/components/layout/footer";
import ReactQueryProvider from "@/providers/react-query-provider";
import Template from "./template";

export const metadata: Metadata = {
  metadataBase: new URL("https://aep-store.vercel.app/"),
  title: {
    default: "Oea market",
    template: "%s | Oea",
  },
  description:
    "Oea market 專營海外代購，幫助你輕鬆購買全球商品，快速、安全、可靠。代購、電商、跨境購物，一站式服務。",
  keywords: [
    "Oea",
    "Oea market",
    "海外代購",
    "代購平台",
    "跨境電商",
    "購物代購",
    "代購服務",
  ],
  openGraph: {
    title: "Oea market - 代購電商",
    description:
      "Oea market 專營海外代購，幫助你輕鬆購買全球商品，快速、安全、可靠。",
    locale: "zh_TW",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="flex min-h-screen flex-col antialiased">
        <ReactQueryProvider>
          <Toaster position="bottom-right" richColors />
          <Navbar />
          <Template>{children}</Template>
          <Footer />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
