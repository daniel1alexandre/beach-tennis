"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Trophy,
  Maximize2,
  Minimize2,
  Clock,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Flame,
  Volume2,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface MatchPlayer {
  id: string;
  a1: string;
  a2: string;
}

interface CourtCardData {
  id: string;
  name: string;
  type: string;
  status: string;
  displayOrder: number;
  activeMatch: {
    id: string;
    categoryName: string;
    phase: string;
    groupId?: string | null;
    round: number;
    status: string;
    scoreA: number;
    scoreB: number;
    startedAt?: string | null;
    elapsedMinutes: number;
    pairA: MatchPlayer | null;
    pairB: MatchPlayer | null;
  } | null;
}

interface WaitingQueueItem {
  queuePosition: number;
  id: string;
  categoryName: string;
  phase: string;
  groupId?: string | null;
  status: string;
  scheduledTime?: string | null;
  pairA: { id: string; name: string; full: string } | null;
  pairB: { id: string; name: string; full: string } | null;
}

export default function TelaoBigScreenPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [data, setData] = useState<{
    tournament: { id: string; name: string; location: string };
    courts: CourtCardData[];
    waitingQueue: WaitingQueueItem[];
    stats: { activeLiveCount: number; totalCourts: number; freeCourts: number };
  } | null>(null);

  const [currentTime, setCurrentTime] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Clock ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 5-second polling (RF-024 / RNF-002)
  useEffect(() => {
    if (!tournamentId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/telao/${tournamentId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Erro ao buscar dados do telão:", err);
      }
    };

    fetchData();
    const pollInterval = setInterval(fetchData, 4000);
    return () => clearInterval(pollInterval);
  }, [tournamentId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const formatPhaseLabel = (phase: string, groupId?: string | null) => {
    if (groupId) return groupId;
    switch (phase) {
      case "FINAL":
        return "Grande Final";
      case "SEMIFINALS":
        return "Semifinal";
      case "QUARTERFINALS":
        return "Quartas de Final";
      case "ROUND_OF_16":
        return "Oitavas de Final";
      default:
        return "Fase de Grupos";
    }
  };

  const getLastNameOrFirst = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
  };

  const formatPairShort = (p: MatchPlayer | null) => {
    if (!p) return "A definir";
    const n1 = getLastNameOrFirst(p.a1);
    const n2 = p.a2 ? getLastNameOrFirst(p.a2) : "";
    return n2 ? `${n1} / ${n2}` : n1;
  };

  return (
    <div className="min-h-screen bg-[#060B12] text-white flex flex-col justify-between selection:bg-none select-none font-sans overflow-hidden">
      {/* 1. Header do Telão */}
      <header className="px-6 py-4 bg-[#0C1726] border-b-2 border-[#162D4A] flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00D2FF] to-[#0077FF] flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Trophy className="w-7 h-7 text-[#060B12] stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl lg:text-3xl font-black tracking-wider text-white">
                VIVA <span className="text-[#00D2FF]">BY BAUMANN</span>
              </span>
              <span className="hidden sm:inline-block text-xs uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40 font-bold">
                Beach Tennis
              </span>
            </div>
            <p className="text-xs lg:text-sm text-slate-400 font-medium tracking-wide">
              {data?.tournament.name || "Torneio Open Viva By Baumann"} • {data?.tournament.location || "Arena Viva"}
            </p>
          </div>
        </div>

        {/* Central Arena Status */}
        <div className="hidden md:flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[#08111B] border border-cyan-500/40 shadow-inner">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#00D2FF]"></span>
          </span>
          <div className="text-xs uppercase tracking-wider font-extrabold text-slate-300">
            STATUS ARENA:{" "}
            <span className="text-[#00D2FF] text-sm font-black">
              {data?.stats.activeLiveCount ?? 0} JOGOS AO VIVO
            </span>
          </div>
        </div>

        {/* Right side: Clock & Controls */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#00D2FF] hidden sm:inline" />
              <span>{currentTime}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              Horário Oficial Arena
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Link
              href={`/telao/${tournamentId}/admin`}
              target="_blank"
              className="p-2.5 rounded-xl bg-[#08111B] hover:bg-[#13253C] border border-[#162D4A] text-slate-300 hover:text-white transition"
              title="Abrir Mesa de Operação"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Link>

            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-[#08111B] hover:bg-[#13253C] border border-[#162D4A] text-slate-300 hover:text-white transition"
              title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia (1080p/4K)"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Grid de Quadras Superiores */}
      <main className="p-6 flex-1 flex flex-col justify-center max-w-[1920px] mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm lg:text-base font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#00D2FF]" />
            Quadras em Andamento
          </h2>
          <div className="text-xs text-slate-400">
            Auto-refresh a cada 4 segundos • Quadras Ativas:{" "}
            <span className="text-[#00D2FF] font-bold">{data?.courts.length || 0}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
          {data?.courts.map((court) => {
            const hasMatch = !!court.activeMatch;
            const match = court.activeMatch;

            if (hasMatch && match) {
              return (
                <div
                  key={court.id}
                  className="rounded-2xl border-2 border-[#00D2FF] bg-[#0C1726] p-5 shadow-2xl shadow-cyan-950/50 relative overflow-hidden flex flex-col justify-between transition-all hover:scale-[1.01]"
                  style={{ minHeight: "230px" }}
                >
                  {/* Subtle live background glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Header do Card da Quadra */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-sm lg:text-base uppercase tracking-wider text-white">
                        {court.name}
                      </span>
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-[#00D2FF] text-[11px] font-black uppercase tracking-wider shadow-sm animate-pulse">
                        <Radio className="w-3 h-3 text-[#00D2FF]" />
                        AO VIVO
                      </span>
                    </div>

                    <div className="text-xs font-bold text-cyan-300 uppercase tracking-wide truncate">
                      {match.categoryName} • {formatPhaseLabel(match.phase, match.groupId)}
                    </div>
                  </div>

                  {/* Placar Gigante em Destaque */}
                  <div className="my-3 space-y-2">
                    {/* Dupla A */}
                    <div className="flex items-center justify-between bg-[#08111B] px-3.5 py-2 rounded-xl border border-[#162D4A]">
                      <span className="font-extrabold text-sm lg:text-base text-slate-100 truncate pr-2">
                        {formatPairShort(match.pairA)}
                      </span>
                      <span className="text-2xl lg:text-3xl font-black font-mono text-[#00D2FF] px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 min-w-[42px] text-center shadow-inner">
                        {match.scoreA}
                      </span>
                    </div>

                    {/* Dupla B */}
                    <div className="flex items-center justify-between bg-[#08111B] px-3.5 py-2 rounded-xl border border-[#162D4A]">
                      <span className="font-extrabold text-sm lg:text-base text-slate-100 truncate pr-2">
                        {formatPairShort(match.pairB)}
                      </span>
                      <span className="text-2xl lg:text-3xl font-black font-mono text-[#00D2FF] px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 min-w-[42px] text-center shadow-inner">
                        {match.scoreB}
                      </span>
                    </div>
                  </div>

                  {/* Footer com Tempo Decorrido */}
                  <div className="pt-2 border-t border-[#162D4A] flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Tempo: <strong className="text-slate-200">{match.elapsedMinutes} min</strong>
                    </span>
                    <span className="text-[10px] uppercase font-bold text-cyan-400/80">
                      Game a Game
                    </span>
                  </div>
                </div>
              );
            }

            // Quadra Livre
            return (
              <div
                key={court.id}
                className="rounded-2xl border-2 border-dashed border-[#162D4A] bg-[#0A131F] p-5 shadow-lg flex flex-col justify-between transition-all"
                style={{ minHeight: "230px" }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm lg:text-base uppercase tracking-wider text-slate-300">
                    {court.name}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#08111B] text-[#00D2FF] border border-cyan-500/40">
                    LIVRE
                  </span>
                </div>

                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-[#08111B] border border-[#162D4A] flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <Trophy className="w-6 h-6 stroke-[1.5] text-cyan-500/70" />
                  </div>
                  <div className="text-xs lg:text-sm font-extrabold uppercase tracking-wider text-slate-300">
                    Aguardando Próximo Jogo
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Pronta para chamada da mesa
                  </div>
                </div>

                <div className="pt-2 border-t border-[#162D4A] text-[11px] text-slate-500 text-center font-medium">
                  {court.type === "INDOOR_SAND" ? "Areia Coberta" : "Areia Externa"}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 3. Fila de Espera / Próximos Confrontos (Lower List) */}
      <footer className="p-6 bg-[#0C1726] border-t-2 border-[#162D4A]">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs lg:text-sm font-extrabold uppercase tracking-widest text-[#00D2FF] flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Fila de Espera / Próximos Confrontos
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              Apresentação imediata dos atletas após chamada
            </span>
          </div>

          <div className="space-y-2">
            {(!data?.waitingQueue || data.waitingQueue.length === 0) ? (
              <div className="py-4 text-center text-xs text-slate-500 italic bg-[#08111B] rounded-xl border border-[#162D4A]">
                Nenhum jogo na fila imediata no momento.
              </div>
            ) : (
              data.waitingQueue.slice(0, 4).map((item, idx) => {
                const isFirst = idx === 0;
                const formattedTime = item.scheduledTime
                  ? new Date(item.scheduledTime).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "A definir";

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      isFirst
                        ? "bg-[#0E2038] border-cyan-500/50 shadow-md shadow-cyan-950/30"
                        : "bg-[#08111B] border-[#162D4A]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black font-mono shrink-0 ${
                          isFirst
                            ? "bg-[#00D2FF] text-[#060B12] shadow-sm"
                            : "bg-[#162D4A] text-slate-300"
                        }`}
                      >
                        [{item.queuePosition}]
                      </span>

                      <div className="font-mono text-xs font-bold text-slate-400">
                        {formattedTime}
                      </div>

                      <div className="text-xs font-extrabold text-white">
                        <span className="text-[#00D2FF] mr-1.5 font-semibold">
                          {item.categoryName} ({formatPhaseLabel(item.phase, item.groupId)}):
                        </span>
                        <span>
                          {item.pairA?.name || "Dupla A"} <span className="text-slate-500 font-normal">vs.</span> {item.pairB?.name || "Dupla B"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-0 flex items-center gap-2">
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                          isFirst
                            ? "bg-cyan-500/20 text-[#00D2FF] border-cyan-500/50 animate-pulse"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {isFirst ? "CHAMANDO DUPLA" : "AGUARDANDO LIBERAÇÃO"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
