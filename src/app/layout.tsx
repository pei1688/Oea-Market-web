import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import { Toaster } from "sonner";
import Footer from "@/components/layout/footer";
import ReactQueryProvider from "@/providers/react-query-provider";
import { Montserrat, Noto_Sans_TC } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL("https://oea-market-web.vercel.app"),
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
    siteName: "Oea Market",
    description:
      "Oea market 專營海外代購，幫助你輕鬆購買全球商品，快速、安全、可靠。",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: "/default-collection.jpg",
        width: 1200,
        height: 630,
        alt: "Oea Market 品牌封面",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body
        className={`${montserrat.variable} ${notoSansTC.variable} flex min-h-screen flex-col antialiased`}
      >
        <ReactQueryProvider>
          <Toaster position="top-center" richColors />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
