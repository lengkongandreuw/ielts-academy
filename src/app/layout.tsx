import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IELTS Academy",
  description: "Platform belajar IELTS Academic adaptif dengan AI tutor — menuju Band 7.0.",
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/manifest.webmanifest`,
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/icon.svg` },
};
export const viewport: Viewport = { themeColor: "#2f5fd0", width: "device-width", initialScale: 1 };

// Applies the saved theme before paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem('ia-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} min-h-dvh`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
