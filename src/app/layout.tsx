import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Viandas Florida | Comida casera, todos los días",
  description: "Viandas caseras, abundantes y listas para disfrutar en Florida y alrededores.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
