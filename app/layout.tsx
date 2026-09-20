import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Viva By Baumann | Gestão de Torneios de Beach Tennis",
  description:
    "Sistema completo para gestão de torneios de Beach Tennis: chaveamento, fase de grupos, agendamento de quadras, modo telão e resultados em tempo real.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-[#060B12] text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
