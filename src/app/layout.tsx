import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaElementsInit } from "@/components/PwaElementsInit";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Restaurant Profit",
  description: "Know where your restaurant's money goes.",
};

// viewportFit: "cover" lets the page draw edge-to-edge and read the safe-area-inset-*
// CSS env() variables — required for the iOS app shell (Capacitor's WKWebView has no
// browser chrome reserving space for the notch/home indicator the way Safari does).
// userScalable/maximumScale: false/1 turn off double-tap-to-zoom and pinch-zoom, which
// otherwise fire on ordinary taps inside the native app shell and feel like a bug —
// a webpage should stay zoomable, but this shell is meant to read as a native app.
export const viewport: Viewport = {
  viewportFit: "cover",
  userScalable: false,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaElementsInit />
        {children}
      </body>
    </html>
  );
}
