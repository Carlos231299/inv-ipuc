import type { Metadata, Viewport } from "next";
import "./globals.css";
import "sweetalert2/dist/sweetalert2.min.css";

export const metadata: Metadata = {
  title: "Inventario IPUC 19",
  description: "Inventario de equipos y reportes — IPUC 19, Maicao, Altos del Parrantial",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
