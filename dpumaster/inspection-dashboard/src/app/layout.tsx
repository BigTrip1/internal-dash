import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/context/DataContext";
import { INITIAL_DATA } from "@/types";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JCB Inspection Dashboard",
  description: "JCB Quality Control Inspection Dashboard with Admin Panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <DataProvider initialData={INITIAL_DATA}>
          <Navigation />
          <main className="jcb-main-content">{children}</main>
          <Footer />
        </DataProvider>
      </body>
    </html>
  );
}
