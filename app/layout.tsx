import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/lib/stack";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canchas SaaS",
  description: "Sistema de gestión de canchas sintéticas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            {children}
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}