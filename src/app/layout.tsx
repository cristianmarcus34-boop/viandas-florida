import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "Viandas Florida | Comida casera, todos los días",
  description: "Viandas caseras, abundantes y listas para disfrutar en Florida y alrededores.",
  applicationName: "Viandas Florida",
  openGraph: {
    title: "Viandas Florida | Comida casera, todos los días",
    description: "Viandas caseras, abundantes y listas para disfrutar en Florida y alrededores.",
    siteName: "Viandas Florida",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Viandas Florida | Comida casera, todos los días",
    description: "Viandas caseras, abundantes y listas para disfrutar en Florida y alrededores.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
