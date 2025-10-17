import type { Metadata } from "next";
import "./globals.css";
import { DataProvider } from "@/context/DataContext";
import { INITIAL_DATA } from "@/types";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

// Use system fonts instead of Google Fonts for corporate firewall compatibility
// const inter = Inter({ subsets: ["latin"] });

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
      <body className="font-sans antialiased">
        <DataProvider initialData={INITIAL_DATA}>
          <Navigation />
          <main className="jcb-main-content">{children}</main>
          <Footer />
        </DataProvider>
      </body>
    </html>
  );
}
