import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { BrowserStoreProvider } from "@/components/BrowserStore";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "600", "700"],
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Hearth",
    template: "%s · Hearth",
  },
  description:
    "Share a prayer request, pray for others, and keep a personal list on this device.",
  applicationName: "Hearth",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3eee6" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1916" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable}`}>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <BrowserStoreProvider>
          <SiteHeader />
          <main id="main" className="shell main">
            {children}
          </main>
          <SiteFooter />
        </BrowserStoreProvider>
      </body>
    </html>
  );
}
