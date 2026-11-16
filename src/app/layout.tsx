import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "IELTS Academy",
  description: "Belajar IELTS secara personal — rencana 112 hari, latihan interaktif, dan evaluasi cerdas menuju Band 7.0.",
  manifest: `${base}/manifest.webmanifest`,
  icons: { icon: `${base}/icon.svg` },
  openGraph: { title: "IELTS Academy", description: "Belajar IELTS secara personal.", images: [`${base}/images/putra-hero.webp`] },
};
export const viewport: Viewport = { themeColor: "#08080a", width: "device-width", initialScale: 1 };

// Applies the saved theme before paint to avoid a flash (dark is the brand default).
const themeScript = `try{if(localStorage.getItem('ia-theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${jakarta.variable} min-h-dvh`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
