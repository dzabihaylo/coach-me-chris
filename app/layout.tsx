import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coach Me — Sales Negotiation Coach",
  description:
    "Real-time negotiation and communication coaching powered by Chris Voss techniques",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#0f1117] text-gray-100">
        {children}
      </body>
    </html>
  );
}
