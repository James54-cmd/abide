import type { Metadata, Viewport } from "next";
import { Lora, DM_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Abide — Bible Encouragement",
  description: "A warm, Spirit-filled companion grounded in God's Word.",
  icons: {
    icon: [{ url: "/assets/abide-symbol.png", type: "image/png" }],
    apple: [{ url: "/assets/abide-symbol.png", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FAF7F2",
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(lora.variable, dmSans.variable, "font-sans")}>
      <body className="min-h-dvh">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
