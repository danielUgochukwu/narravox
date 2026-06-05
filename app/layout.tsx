import type { Metadata } from "next";
import { IBM_Plex_Serif } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";

import Navbar from "@/components/Navbar";
import "./globals.css";

const ibmPlexSerif = IBM_Plex_Serif({
  variable: "--font-ibm-plex-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const monaSans = localFont({
  variable: "--font-mona-sans",
  src: [
    {
      path: "./fonts/MonaSans-Latin.woff2",
      weight: "200 900",
      style: "normal",
    },
    {
      path: "./fonts/MonaSans-LatinExt.woff2",
      weight: "200 900",
      style: "normal",
    },
    {
      path: "./fonts/MonaSans-Vietnamese.woff2",
      weight: "200 900",
      style: "normal",
    },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bookified",
  description:
    "Transform your books into interactive AI conversation. Upload PDFs, and chat with your books using voice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${ibmPlexSerif.variable} ${monaSans.variable} relative h-full font-sans antialiased`}
      >
        <body className="flex min-h-full flex-col">
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
