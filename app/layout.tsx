
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "E-SERVICE HUB & DIGITAL CYBER",
    template: "%s | E-SERVICE HUB",
  },
  description:
    "Your Premier One-Stop Digital Administrative & Student Support Center. Fast, reliable and affordable digital services, web development, data analytics and digital innovation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
