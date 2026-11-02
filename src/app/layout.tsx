import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GlucoApp — Votre santé, votre rythme",
  description:
    "Suivi glycémique, composition de repas et rituel du thé régulateur.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GlucoApp",
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  // Empêche l'indexation : l'application n'a aucune page publique utile et
  // ses écrans exposent des données de santé.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1a7a4a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${newsreader.variable}`}>
      <head>
        {/* La police d'icônes est auto-hébergée : voir la règle @font-face
            dans globals.css. Aucune requête vers un domaine tiers. */}
        <link
          rel="preload"
          href="/fonts/material-symbols-subset.woff2?v=5e7d7ea4"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
