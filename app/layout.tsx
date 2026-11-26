
import type { Metadata, Viewport } from "next";
import ContactDock from "./components/contact-dock";
import ServiceWorkerRegister from "./components/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "E-SERVICE HUB & DIGITAL CYBER",
    template: "%s | E-SERVICE HUB",
  },
  description:
    "Your Premier One-Stop Digital Administrative & Student Support Center. Fast, reliable and affordable digital services, web development, data analytics and digital innovation.",
  applicationName: "E-SERVICE HUB",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "E-SERVICE HUB",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#061B42",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        {children}
        <ContactDock />
      </body>
    </html>
  );
}
