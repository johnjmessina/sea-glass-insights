import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sea Glass Insights — Premium Market Research Reports",
  description:
    "Boutique market research for small businesses. Get a professionally written, analyst-reviewed report delivered in 48–72 hours.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-sand text-foreground">
        {children}
      </body>
    </html>
  );
}
