"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  LayoutDashboard,
  Layers,
  Users,
  GitBranch,
  Calendar,
  Settings,
  Tv,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";

interface TournamentNavProps {
  tournamentId: string;
  tournamentName: string;
}

export default function TournamentNav({
  tournamentId,
  tournamentName,
}: TournamentNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: `/torneios/${tournamentId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Categorias",
      href: `/torneios/${tournamentId}/categorias`,
      icon: Layers,
    },
    {
      label: "Atletas & Duplas",
      href: `/torneios/${tournamentId}/atletas`,
      icon: Users,
    },
    {
      label: "Chaveamento",
      href: `/torneios/${tournamentId}/gerar-jogos`,
      icon: GitBranch,
    },
    {
      label: "Programação",
      href: `/torneios/${tournamentId}/programacao`,
      icon: Calendar,
    },
    {
      label: "Resultados",
      href: `/torneios/${tournamentId}/resultados`,
      icon: CheckCircle2,
    },
    {
      label: "Configurações",
      href: `/torneios/${tournamentId}/config`,
      icon: Settings,
    },
  ];

  return (
    <header className="border-b border-[#182C46] bg-[#0A1424]/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group transition-opacity hover:opacity-90"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Trophy className="w-5 h-5 text-black font-bold" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-wider text-white">
                  VIVA <span className="text-cyan-400 font-medium">BY BAUMANN</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-medium">
                  Beach Tennis
                </span>
              </div>
            </Link>

            <span className="text-zinc-600 hidden md:inline">/</span>
            <span className="text-zinc-300 font-semibold text-sm hidden md:inline truncate max-w-xs">
              {tournamentName}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Action to Arena Screen */}
            <Link
              href={`/telao/${tournamentId}`}
              target="_blank"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-xs sm:text-sm font-semibold transition shadow-sm"
              title="Abrir Telão da Arena em Nova Aba"
            >
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>Modo Telão</span>
            </Link>

            <Link
              href={`/telao/${tournamentId}/admin`}
              target="_blank"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/40 text-xs sm:text-sm font-semibold transition shadow-sm"
              title="Painel Rápido de Mesa e Operador de Quadra"
            >
              <SlidersHorizontal className="w-4 h-4 text-cyan-300" />
              <span className="hidden sm:inline">Operador Telão</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar">
        <nav className="flex space-x-1 sm:space-x-2 py-2">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/10"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-zinc-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
