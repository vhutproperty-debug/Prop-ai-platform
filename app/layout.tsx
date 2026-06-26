import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Prop AI — Mumbai's AI-First Real Estate Platform",
    template: "%s | Prop AI",
  },
  description:
    "Discover Mumbai real estate with AI-powered search, market intelligence, and investment insights. Not a listing portal — an operating system for property decisions.",
  keywords: [
    "Mumbai real estate",
    "AI property search",
    "Mumbai apartments",
    "property investment Mumbai",
    "Prop AI",
  ],
  openGraph: {
    title: "Prop AI — Mumbai's AI-First Real Estate Platform",
    description:
      "AI-powered property search, market intelligence, and investment insights for Mumbai real estate.",
    type: "website",
    locale: "en_IN",
    siteName: "Prop AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prop AI — Mumbai's AI-First Real Estate Platform",
    description:
      "AI-powered property search and market intelligence for Mumbai.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}
