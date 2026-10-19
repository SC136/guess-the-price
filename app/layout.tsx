import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const docallisme = localFont({
  src: "../public/fonts/docallismeonstreet.otf",
  variable: "--font-signature",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://guess-the-price-can-u.vercel.app",
  ),
  title: { default: "Guess the Price", template: "%s · Guess the Price" },
  description: "See a real product, guess its price. Pick from options or type your own guess and score points for getting close.",
  openGraph: {
    title: "Guess the Price",
    description: "See a real product, guess its price. Pick from options or type your own guess and score points for getting close.",
    url: "https://guess-the-price-can-u.vercel.app",
    siteName: "Guess the Price",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Guess the Price — The Retail Price Game",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guess the Price",
    description: "See a real product, guess its price. Pick from options or type your own guess and score points for getting close.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={docallisme.variable}>
      <body>{children}</body>
    </html>
  );
}
