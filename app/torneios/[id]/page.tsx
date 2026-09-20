import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentNav from "@/components/TournamentNav";
import {
  Trophy,
  Users,
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  Tv,
  SlidersHorizontal,
  Flame,
  ArrowRight,
  TrendingUp,
  MapPin,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TournamentDashboardPage({
  params,
}: {
  params: { id: string };
}) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      settings: true,
      courts: { orderBy: { displayOrder: "asc" } },
      categories: {
        include: {
          pairs: { include: { athlete1: true, athlete2: true } },
          matches: {
            include: {
              category: true,
              court: true,
              pairA: { include: { athlete1: true, athlete2: true } },
              pairB: { include: { athlete1: true, athlete2: true } },
              winnerPair: { include: { athlete1: true, athlete2: true } },
            },
          },
        },
      },
    },
  });

  if (!tournament) notFound();

  // Metrics calculation
  const totalCategories = tournament.categories.length;
  const totalPairs = tournament.categories.reduce(
    (acc, cat) => acc + cat.pairs.length,
    0
  );
  const allMatches = tournament.categories.flatMap((cat) => cat.matches);
  const totalMatches = allMatches.length;
  const finishedMatches = allMatches.filter(
    (m) => m.status === "FINISHED" || m.status.startsWith("WALKOVER")
  ).length;
  const liveMatches = allMatches.filter(
    (m) => m.status === "LIVE" || m.status === "WARMUP"
  ).length;
  const pendingMatches = totalMatches - finishedMatches - liveMatches;
  const progressPercent =
    totalMatches > 0 ? Math.round((finishedMatches / totalMatches) * 100) : 0;

  const totalCourts = tournament.courts.length;
  const occupiedCourts = tournament.courts.filter(
    (c) => c.status === "OCCUPIED"
  ).length;
  const availableCourts = tournament.courts.filter(
    (c) => c.status === "AVAILABLE"
  ).length;

  return (
    <div className="min-h-screen bg-[#060B12] text-slate-100 flex flex-col font-sans">
      <TournamentNav
        tournamentId={tournament.id}
        tournamentName={tournament.name}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0C192E] via-[#0D213F] to-[#081220] border border-[#163359] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40 text-xs font-black uppercase tracking-wider">
                {tournament.status === "ACTIVE" ? "Torneio Ativo" : tournament.status}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-[#00D2FF]" />
                {new Date(tournament.startDate).toLocaleDateString("pt-BR")} a{" "}
                {new Date(tournament.endDate).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {tournament.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cyan-400" />
              {tournament.location} • Org: {tournament.organizer}
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <Link
              href={`/telao/${tournament.id}`}
              target="_blank"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#0099FF] hover:from-[#33DDFF] hover:to-[#1AA3FF] text-[#060B12] font-black text-sm transition shadow-lg shadow-cyan-500/30 active:scale-95"
            >
              <Tv className="w-4 h-4" />
              <span>Abrir Modo Telão</span>
            </Link>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Inscritos */}
          <div className="p-5 rounded-2xl bg-[#0C1726] border border-[#162D4A] shadow-md flex flex-col justify-between hover:border-cyan-500/40 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Inscritos</span>
              <Users className="w-4 h-4 text-[#00D2FF]" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {totalPairs}{" "}
                <span className="text-xs font-medium text-slate-400">duplas</span>
              </div>
              <div className="text-[11px] text-[#00D2FF] mt-1 font-semibold">
                {totalPairs * 2} atletas confirmados
              </div>
            </div>
          </div>

          {/* Card 2: Categorias */}
          <div className="p-5 rounded-2xl bg-[#0C1726] border border-[#162D4A] shadow-md flex flex-col justify-between hover:border-cyan-500/40 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Categorias</span>
              <Layers className="w-4 h-4 text-[#00D2FF]" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {totalCategories}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Todas as categorias ativas
              </div>
            </div>
          </div>

          {/* Card 3: Progresso dos Jogos */}
          <div className="p-5 rounded-2xl bg-[#0C1726] border border-[#162D4A] shadow-md flex flex-col justify-between hover:border-cyan-500/40 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Jogos Concluídos</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {progressPercent}%
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({finishedMatches}/{totalMatches})
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-[#13233A] rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#00D2FF] to-blue-500 h-1.5 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Quadras Ativas */}
          <div className="p-5 rounded-2xl bg-[#0C1726] border border-[#162D4A] shadow-md flex flex-col justify-between hover:border-cyan-500/40 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Quadras Arena</span>
              <Flame className="w-4 h-4 text-[#00D2FF]" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#00D2FF]">
                {occupiedCourts}{" "}
                <span className="text-xs font-normal text-slate-400">
                  em jogo / {totalCourts} total
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {availableCourts} quadras livres para chamada
              </div>
            </div>
          </div>
        </div>

        {/* Live Quadras Quick Strip */}
        <div className="p-6 rounded-2xl bg-[#0B1523] border border-[#162D4A] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00D2FF]"></span>
              </span>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Status das Quadras em Tempo Real
              </h3>
            </div>
            <Link
              href={`/telao/${tournament.id}/admin`}
              className="text-xs font-bold text-[#00D2FF] hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Abrir Mesa de Operação</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {tournament.courts.map((court) => {
              const liveOnCourt = allMatches.find(
                (m) =>
                  m.courtId === court.id &&
                  (m.status === "LIVE" || m.status === "WARMUP")
              );

              return (
                <div
                  key={court.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    liveOnCourt
                      ? "bg-[#0E2038] border-cyan-500/60 shadow-lg shadow-cyan-950/40"
                      : "bg-[#09111C] border-[#162D4A]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {court.name}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        liveOnCourt
                          ? "bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40 animate-pulse"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {liveOnCourt ? "AO VIVO" : "LIVRE"}
                    </span>
                  </div>

                  {liveOnCourt ? (
                    <div>
                      <div className="text-[11px] text-slate-200 font-bold truncate">
                        {liveOnCourt.scoreA} × {liveOnCourt.scoreB}
                      </div>
                      <div className="text-[10px] text-cyan-300/80 truncate">
                        {liveOnCourt.category.name}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">Disponível</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Categorias & Atividades Recentes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categorias List */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0C1726] border border-[#162D4A] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00D2FF]" />
                Categorias do Torneio
              </h3>
              <Link
                href={`/torneios/${tournament.id}/categorias`}
                className="text-xs text-[#00D2FF] hover:underline font-semibold"
              >
                Gerenciar Categorias
              </Link>
            </div>

            <div className="space-y-3">
              {tournament.categories.map((cat) => {
                const catFinished = cat.matches.filter(
                  (m) => m.status === "FINISHED"
                ).length;
                const catTotal = cat.matches.length;
                const catPct =
                  catTotal > 0 ? Math.round((catFinished / catTotal) * 100) : 0;

                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl bg-[#09111C] border border-[#162D4A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-500/30 transition"
                    style={{ borderLeftWidth: "4px", borderLeftColor: cat.color || "#00D2FF" }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || "#00D2FF" }}
                        />
                        <h4 className="font-extrabold text-sm text-white">{cat.name}</h4>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {cat.type === "DUPLA_MASC"
                            ? "Masc"
                            : cat.type === "DUPLA_FEM"
                            ? "Fem"
                            : cat.type === "DUPLA_MISTA"
                            ? "Misto"
                            : "Simples"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {cat.pairs.length} duplas inscritas • {cat.groupCount} grupos • avança top {cat.advancePerGroup}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#00D2FF]">
                          {catFinished}/{catTotal} jogos
                        </span>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {catPct}% concluído
                        </div>
                      </div>

                      <Link
                        href={`/torneios/${tournament.id}/gerar-jogos`}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition"
                      >
                        Chaveamento
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action Box */}
          <div className="p-6 rounded-2xl bg-[#0C1726] border border-[#162D4A] flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-base font-bold text-white mb-2">Acesso Rápido</h3>
              <p className="text-xs text-slate-400 mb-4">
                Atalhos operacionais para conduzir o evento com máxima agilidade:
              </p>

              <div className="space-y-2">
                <Link
                  href={`/torneios/${tournament.id}/atletas`}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#09111C] hover:bg-[#0E1D31] border border-[#162D4A] text-xs font-semibold text-slate-200 transition group"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#00D2FF]" />
                    Inscrever Atletas / Importar CSV
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
                </Link>

                <Link
                  href={`/torneios/${tournament.id}/programacao`}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#09111C] hover:bg-[#0E1D31] border border-[#162D4A] text-xs font-semibold text-slate-200 transition group"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#00D2FF]" />
                    Grade Horária e Alocação
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
                </Link>

                <Link
                  href={`/torneios/${tournament.id}/resultados`}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#09111C] hover:bg-[#0E1D31] border border-[#162D4A] text-xs font-semibold text-slate-200 transition group"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00D2FF]" />
                    Lançar Placares & Homologação
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
                </Link>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-[11px] text-cyan-200">
              💡 <strong>Dica Operacional:</strong> Use o Modo Telão em televisores e a Mesa de Operação em tablets ou notebooks para sincronização instantânea.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
