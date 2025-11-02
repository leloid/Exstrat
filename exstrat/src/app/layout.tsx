import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PortfolioProvider } from "@/contexts/PortfolioContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Layout from "@/components/layout/Layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ExStrat - Gestion de Stratégies Crypto",
  description: "Plateforme professionnelle pour la gestion de stratégies de trading crypto avec alertes automatisées",
  keywords: "crypto, trading, stratégies, portfolio, alertes, binance, coinbase",
  authors: [{ name: "ExStrat Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full overflow-x-hidden">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-x-hidden`}
      >
        <AuthProvider>
          <PortfolioProvider>
            <ThemeProvider>
              <Layout>
                {children}
              </Layout>
            </ThemeProvider>
          </PortfolioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
