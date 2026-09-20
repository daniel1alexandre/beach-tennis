import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Trophy, Tv, Calendar, MapPin, Users, ArrowRight, PlusCircle, CheckCircle2, Shield } from "lucide-react";
import CreateTournamentModal from "@/components/CreateTournamentModal";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tournaments = await prisma.tournament.findMany({
    include: {
      categories: {
        include: {
          _count: { select: { pairs: true, matches: true } },
        },
      },
      courts: true,
      _count: {
        select: { categories: true, courts: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#060B12] text-slate-100 flex flex-col">
      {/* Top Banner / Header */}
      <header className="border-b border-[#182C46] bg-[#0A1424]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Trophy className="w-6 h-6 text-black font-black" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wider text-white">
                VIVA <span className="text-cyan-400 font-semibold">BY BAUMANN</span>
              </h1>
              <p className="text-xs text-zinc-400 tracking-wide">
                Gestão Profissional de Torneios de Beach Tennis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <CreateTournamentModal />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 border-b border-[#15263D] bg-gradient-to-b from-[#0A1628] to-[#060B12]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,210,255,0.12),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Shield className="w-3.5 h-3.5" /> Temporada Oficial 2026
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl leading-tight">
            Plataforma Completa para <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Arenas, Organizadores & Atletas</span>
          </h2>
          <p className="mt-3 text-zinc-400 text-sm sm:text-base max-w-2xl">
            Chaveamento automático por fase de grupos (round-robin) e mata-mata (brackets ITF/CBT), prevenção de conflitos de quadra e descanso, e Modo Telão de alta performance para TVs da arena.
          </p>
        </div>
      </section>

      {/* Main Tournament Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-cyan-400" />
              Torneios em Andamento & Programados
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Selecione um evento para acessar o painel de controle operacional ou telão público
            </p>
          </div>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-[#1B2F4A] bg-[#0A1422]/50">
            <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-zinc-300">Nenhum torneio cadastrado ainda</h4>
            <p className="text-sm text-zinc-500 max-w-md mx-auto mt-1 mb-6">
              Inicie um novo torneio para configurar categorias, inscrever duplas e gerar os confrontos.
            </p>
            <CreateTournamentModal />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t) => {
              const totalPairs = t.categories.reduce(
                (acc, cat) => acc + cat._count.pairs,
                0
              );
              const totalMatches = t.categories.reduce(
                (acc, cat) => acc + cat._count.matches,
                0
              );

              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-[#182C46] bg-[#0C1726] p-6 hover:border-cyan-500/50 transition-all flex flex-col justify-between shadow-lg hover:shadow-cyan-950/30 group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          t.status === "ACTIVE"
                            ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/40"
                            : t.status === "FINISHED"
                            ? "bg-zinc-700/30 text-zinc-400 border-zinc-700"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {t.status === "ACTIVE"
                          ? "● Em Andamento"
                          : t.status === "FINISHED"
                          ? "Finalizado"
                          : "Rascunho"}
                      </span>

                      <div className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        {new Date(t.startDate).toLocaleDateString("pt-BR")}
                      </div>
                    </div>

                    <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {t.name}
                    </h4>

                    <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{t.location}</span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2 py-3 px-3.5 rounded-xl bg-[#08101A] border border-[#16273C]">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-medium">Categorias</span>
                        <span className="text-sm font-bold text-white">{t._count.categories}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-medium">Duplas</span>
                        <span className="text-sm font-bold text-cyan-400">{totalPairs}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-medium">Quadras</span>
                        <span className="text-sm font-bold text-white">{t._count.courts}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#182C46] flex flex-col gap-2">
                    <Link
                      href={`/torneios/${t.id}`}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm transition shadow-sm"
                    >
                      <span>Painel de Gestão</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/telao/${t.id}`}
                        target="_blank"
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#111F32] hover:bg-[#182E4B] border border-[#1D3656] text-cyan-300 text-xs font-semibold transition"
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span>Telão Arena</span>
                      </Link>

                      <Link
                        href={`/telao/${t.id}/admin`}
                        target="_blank"
                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#111F32] hover:bg-[#182E4B] border border-[#1D3656] text-sky-300 text-xs font-semibold transition"
                      >
                        <span>Mesa / Operador</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#15231B] bg-[#070C09] py-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-zinc-300">Viva By Baumann</span> • Sistema Operacional de Torneios
          </div>
          <div>Desenvolvido com Next.js 14, TailwindCSS & Prisma ORM</div>
        </div>
      </footer>
    </div>
  );
}
