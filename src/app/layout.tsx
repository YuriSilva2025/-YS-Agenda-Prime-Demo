import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenda Prime | Demo YS Soluções Digitais",
  description: "Demonstração comercial de agendamento e gestão criada pela YS Soluções Digitais.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
