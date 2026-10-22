import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atelier Solstice · Art Studio & Ceramic Commissions",
  description:
    "An artisanal studio offering one-of-a-kind original paintings, on-demand architectural wall murals, and custom wheel-thrown pottery.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-terracotta selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
