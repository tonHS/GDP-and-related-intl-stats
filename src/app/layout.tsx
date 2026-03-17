import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GDP & International Stats | IMF Dashboard",
  description:
    "Global Economic Dashboard — live data from the IMF World Economic Outlook DataMapper API.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
