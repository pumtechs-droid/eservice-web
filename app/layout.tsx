
import type { Metadata, Viewport } from "next";
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
      </body>
    </html>
  );
}
