import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Wedify · Wedding Organizer",
  description: "Organizează nunta perfectă — invitați, mese, buget, task-uri, furnizori. Tot ce ai nevoie într-un singur loc.",
  keywords: "wedding planner, organizare nuntă, invitați, mese, buget nuntă",
  authors: [{ name: "Wedify" }],
  icons: {
    icon: "/wedify-logo.png",
    apple: "/wedify-logo.png",
  },
  openGraph: {
    title: "Wedify · Wedding Organizer",
    description: "Organizează nunta perfectă — invitați, mese, buget, task-uri, furnizori.",
    siteName: "Wedify",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
