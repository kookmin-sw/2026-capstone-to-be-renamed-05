import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { S3WebRedirect } from "@/components/s3-web-redirect";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CPA Jobs",
  description: "회계사를 위한 채용공고 큐레이션 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <S3WebRedirect />
        {children}
      </body>
    </html>
  );
}
