import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://guess-the-price-can-u.vercel.app",
  ),
  title: { default: "Guess the Price", template: "%s · Guess the Price" },
  description: "See a real product, guess its price. Pick from options or type your own guess and score points for getting close.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
