import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Viandas Florida | Viandas caseras en Florida",
  description: "Comida casera, rica y saludable en Florida. Consultá el menú vigente y hacé tu pedido por WhatsApp.",
  applicationName: "Viandas Florida",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  keywords: [
    "viandas caseras",
    "viandas en Florida",
    "comida casera en Florida",
    "almuerzos caseros",
    "Viandas Florida",
  ],
  openGraph: {
    title: "Viandas Florida | Viandas caseras en Florida",
    description: "Comida casera, rica y saludable en Florida. Consultá el menú vigente y hacé tu pedido por WhatsApp.",
    url: siteUrl,
    siteName: "Viandas Florida",
    locale: "es_AR",
    type: "website",
    images: [{
      url: `${siteUrl}/opengraph-image.jpg`,
      width: 1200,
      height: 1200,
      alt: "Logo de Viandas Florida",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Viandas Florida | Viandas caseras en Florida",
    description: "Comida casera, rica y saludable en Florida. Consultá el menú vigente y hacé tu pedido por WhatsApp.",
    images: [`${siteUrl}/twitter-image.jpg`],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    name: "Viandas Florida",
    url: siteUrl,
    image: `${siteUrl}/imagenes/logoredondoviandas.jpeg`,
    logo: `${siteUrl}/imagenes/logoredondoviandas.jpeg`,
    description: "Comida casera, rica y saludable. Pedidos por WhatsApp.",
    telephone: "+5491128386926",
    address: {
      "@type": "PostalAddress",
      streetAddress: "881 N°5003",
      addressLocality: "Florida",
      addressCountry: "AR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+5491128386926",
      contactType: "pedidos",
      availableLanguage: "Spanish",
    },
    servesCuisine: "Comida casera",
  };

  return (
    <html lang="es">
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness).replace(/</g, "\\u003c") }}
          type="application/ld+json"
        />
      </body>
    </html>
  );
}
