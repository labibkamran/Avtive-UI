import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secure Data Portal",
  description: "Modern account and data transfer interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark h-full font-sans antialiased", geistSans.variable, geistMono.variable)}
    >
      <body className="min-h-full bg-[radial-gradient(circle_at_10%_10%,_#1a2962_0%,_var(--background)_40%,_#070c20_100%)] text-foreground">
        {children}
      </body>
    </html>
  );
}
