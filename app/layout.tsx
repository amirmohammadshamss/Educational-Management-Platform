import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/auth/SessionProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Educational Management Platform",
  description: "Platform for managing lesson bookings, tracking student training hours, and facilitating homework submission",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
