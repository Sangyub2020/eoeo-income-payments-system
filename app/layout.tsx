import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EOEO 통합 수익 및 결제 관리 시스템",
  description: "EOEO All income과 SNS payments 통합 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}


