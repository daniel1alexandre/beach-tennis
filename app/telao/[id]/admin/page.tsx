"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  SlidersHorizontal,
  Tv,
  ArrowLeft,
  Plus,
  Minus,
  Play,
  Flame,
  CheckCircle2,
  Clock,
  ArrowDownCircle,
  RefreshCw,
  Award,
  Undo2,
  XCircle,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function ArenaOperatorAdminPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/telao/${tournamentId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // +1 or -1 Game
  const adjustScore = async (
    matchId: string,
    currentA: number,
    currentB: number,
    deltaA: number,
    deltaB: number
  ) => {
    const newA = Math.max(0, currentA + deltaA);
    const newB = Math.max(0, currentB + deltaB);

    try {
      const res = await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          scoreA: newA,
          scoreB: newB,
          setsDetail: [{ set: 1, gamesA: newA, gamesB: newB }],
        }),
      });

      if (res.ok) {
        showToast(`Placar atualizado: ${newA} × ${newB}`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Change match status (LIVE, WARMUP, FINISHED, etc.)
  const setMatchStatus = async (
    matchId: string,
    status: string,
    courtId?: string
  ) => {
    try {
      const res = await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          status,
          courtId,
        }),
      });

      if (res.ok) {
        showToast(
          status === "LIVE"
            ? "Partida iniciada AO VIVO!"
            : status === "WARMUP"
            ? "Aquecimento em quadra iniciado!"
            : status === "FINISHED"
            ? "Partida FINALIZADA com sucesso! Quadra liberada."
            : `Status atualizado: ${status}`
        );
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cancel match from court and return to queue (Requisito: botão Cancelar / voltar à fila)
  const cancelMatchToQueue = async (matchId: string) => {
    const confirmCancel = window.confirm(
      "Deseja realmente cancelar este jogo da quadra e fazê-lo voltar para a fila de espera?"
    );
    if (!confirmCancel) return;

    try {
      const res = await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          status: "WAITING_COURT",
          courtId: null,
          scoreA: 0,
          scoreB: 0,
        }),
      });

      if (res.ok) {
        showToast("Jogo cancelado da quadra e retornado para a fila de espera!");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Assign match from queue to free court (Puxar jogo da fila)
  const assignMatchToCourt = async (matchId: string, courtId: string) => {
    try {
      const res = await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          courtId,
          status: "WARMUP", // starts warmup immediately on assignment
        }),
      });

      if (res.ok) {
        showToast("Jogo vinculado à quadra! Aquecimento em andamento.");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#060B12] text-white flex flex-col font-sans">
      {/* Header do Operador */}
      <header className="px-4 sm:px-6 py-4 bg-[#0C1726] border-b border-[#162D4A] flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <Link
            href={`/torneios/${tournamentId}`}
            className="p-2 rounded-xl bg-[#08111B] hover:bg-[#13253C] border border-[#162D4A] text-slate-300 hover:text-white transition"
            title="Voltar ao Painel Geral"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white">
                Mesa de Operação do Telão & Quadras
              </h1>
              <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40 font-black tracking-wider">
                Operador Azul Neon
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {data?.tournament.name} • Toque rápido para placar, chamada e cancelamento
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {actionMessage && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#00D2FF]" />
              <span>{actionMessage}</span>
            </div>
          )}

          <ThemeToggle />

          <Link
            href={`/telao/${tournamentId}`}
            target="_blank"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#0099FF] text-[#060B12] font-black text-xs transition shadow-lg shadow-cyan-500/30 active:scale-95"
          >
            <Tv className="w-4 h-4" />
            <span>Ver Telão</span>
          </Link>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-8">
        {/* Quadras Controls */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold uppercase tracking-wider text-[#00D2FF] flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" />
              Controle de Quadras & Placar Game a Game
            </h2>
            <button
              onClick={fetchData}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data?.courts.map((court: any) => {
              const activeMatch = court.activeMatch;

              if (activeMatch) {
                return (
                  <div
                    key={court.id}
                    className="rounded-2xl border-2 border-cyan-500/70 bg-[#0C1726] p-5 shadow-xl shadow-cyan-950/40 flex flex-col justify-between"
                  >
                    <div>
                      {/* Court & Status Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-base text-white">
                          {court.name}
                        </span>
                        <span
                          className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            activeMatch.status === "LIVE"
                              ? "bg-cyan-500/20 text-[#00D2FF] border-cyan-500/50 animate-pulse"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          }`}
                        >
                          {activeMatch.status === "LIVE" ? "● AO VIVO" : "AQUECIMENTO"}
                        </span>
                      </div>

                      <div className="text-xs text-cyan-300 font-semibold mb-3 truncate">
                        {activeMatch.categoryName} • {activeMatch.groupId || activeMatch.phase}
                      </div>

                      {/* Dupla A controls */}
                      <div className="bg-[#08111B] border border-[#162D4A] rounded-xl p-3 mb-2 flex items-center justify-between">
                        <div className="pr-2 truncate">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Dupla A</span>
                          <span className="text-sm font-bold text-white truncate block">
                            {activeMatch.pairA?.a1} / {activeMatch.pairA?.a2}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() =>
                              adjustScore(
                                activeMatch.id,
                                activeMatch.scoreA,
                                activeMatch.scoreB,
                                -1,
                                0
                              )
                            }
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm"
                            title="-1 Game"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-2xl font-black font-mono text-[#00D2FF] min-w-[36px] text-center bg-black/50 rounded-lg py-0.5">
                            {activeMatch.scoreA}
                          </span>
                          <button
                            onClick={() =>
                              adjustScore(
                                activeMatch.id,
                                activeMatch.scoreA,
                                activeMatch.scoreB,
                                1,
                                0
                              )
                            }
                            className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#0099FF] hover:brightness-110 text-[#060B12] flex items-center justify-center font-black text-base shadow-sm active:scale-95"
                            title="+1 Game Dupla A"
                          >
                            <Plus className="w-5 h-5 stroke-[3]" />
                          </button>
                        </div>
                      </div>

                      {/* Dupla B controls */}
                      <div className="bg-[#08111B] border border-[#162D4A] rounded-xl p-3 mb-4 flex items-center justify-between">
                        <div className="pr-2 truncate">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Dupla B</span>
                          <span className="text-sm font-bold text-white truncate block">
                            {activeMatch.pairB?.a1} / {activeMatch.pairB?.a2}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() =>
                              adjustScore(
                                activeMatch.id,
                                activeMatch.scoreA,
                                activeMatch.scoreB,
                                0,
                                -1
                              )
                            }
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm"
                            title="-1 Game"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-2xl font-black font-mono text-[#00D2FF] min-w-[36px] text-center bg-black/50 rounded-lg py-0.5">
                            {activeMatch.scoreB}
                          </span>
                          <button
                            onClick={() =>
                              adjustScore(
                                activeMatch.id,
                                activeMatch.scoreA,
                                activeMatch.scoreB,
                                0,
                                1
                              )
                            }
                            className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#0099FF] hover:brightness-110 text-[#060B12] flex items-center justify-center font-black text-base shadow-sm active:scale-95"
                            title="+1 Game Dupla B"
                          >
                            <Plus className="w-5 h-5 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="space-y-2 pt-3 border-t border-[#162D4A]">
                      {activeMatch.status === "WARMUP" && (
                        <button
                          onClick={() => setMatchStatus(activeMatch.id, "LIVE")}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#0099FF] hover:brightness-110 text-[#060B12] font-black text-xs transition active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-[#060B12]" />
                          Iniciar Partida Oficial
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            setMatchStatus(activeMatch.id, "FINISHED")
                          }
                          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/40 font-bold text-xs transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Finalizar Jogo
                        </button>

                        {/* Botão Cancelar: Volta o jogo para a fila de espera (W.O. removido) */}
                        <button
                          onClick={() => cancelMatchToQueue(activeMatch.id)}
                          className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs transition"
                          title="Cancela a chamada e devolve o jogo para a fila de espera"
                        >
                          <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                          Cancelar (Voltar à Fila)
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Quadra Livre - Permitir puxar jogo da fila com 1 toque
              return (
                <div
                  key={court.id}
                  className="rounded-2xl border-2 border-dashed border-[#1E3A5F] bg-[#0A131F] p-5 shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-extrabold text-base text-slate-300">
                        {court.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#08111B] text-[#00D2FF] border border-cyan-500/40">
                        LIVRE
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-4">
                      Selecione um jogo da fila de espera abaixo para vincular a esta quadra e iniciar o aquecimento.
                    </p>

                    {/* Quick pull from Queue */}
                    {data?.waitingQueue && data.waitingQueue.length > 0 ? (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Puxar próximo da fila para cá:
                        </span>
                        {data.waitingQueue.slice(0, 2).map((qItem: any) => (
                          <button
                            key={qItem.id}
                            onClick={() => assignMatchToCourt(qItem.id, court.id)}
                            className="w-full text-left p-2.5 rounded-xl bg-[#0C1726] hover:bg-[#13253C] border border-[#162D4A] hover:border-cyan-500/50 text-xs transition group flex items-center justify-between"
                          >
                            <div className="truncate pr-2">
                              <span className="text-[10px] text-[#00D2FF] font-bold block">
                                [{qItem.queuePosition}] {qItem.categoryName}
                              </span>
                              <span className="font-semibold text-white truncate block">
                                {qItem.pairA?.name} vs {qItem.pairB?.name}
                              </span>
                            </div>
                            <ArrowDownCircle className="w-5 h-5 text-[#00D2FF] group-hover:scale-110 transition-transform shrink-0" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic py-4 text-center">
                        Nenhum jogo em espera na fila.
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#162D4A] text-[11px] text-slate-500 text-center font-medium mt-4">
                    Status: Pronta para receber jogo
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fila de Espera Geral com Ações */}
        <div className="pt-6 border-t border-[#162D4A]">
          <h2 className="text-base font-extrabold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#00D2FF]" />
            Fila de Espera & Próximos Confrontos ({data?.waitingQueue?.length || 0})
          </h2>

          <div className="space-y-2.5">
            {(!data?.waitingQueue || data.waitingQueue.length === 0) ? (
              <div className="p-6 text-center text-slate-500 bg-[#08111B] rounded-2xl border border-[#162D4A]">
                A fila está vazia. Gere ou agende novas partidas no painel do torneio.
              </div>
            ) : (
              data.waitingQueue.map((item: any) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#0C1726] border border-[#162D4A] hover:border-cyan-500/40 transition-all gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      #{item.queuePosition}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#00D2FF]">
                        {item.categoryName} • {item.groupId || item.phase}
                      </div>
                      <div className="text-sm font-extrabold text-white">
                        {item.pairA?.full || item.pairA?.name} <span className="text-slate-500 font-normal">vs.</span> {item.pairB?.full || item.pairB?.name}
                      </div>
                    </div>
                  </div>

                  {/* Assign to court dropdown or quick buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-medium">Chamar para:</span>
                    {data?.courts
                      ?.filter((c: any) => !c.activeMatch)
                      ?.map((freeCourt: any) => (
                        <button
                          key={freeCourt.id}
                          onClick={() => assignMatchToCourt(item.id, freeCourt.id)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition"
                        >
                          {freeCourt.name}
                        </button>
                      ))}

                    {data?.courts?.filter((c: any) => !c.activeMatch).length === 0 && (
                      <span className="text-[11px] text-slate-500 italic">
                        Todas as quadras ocupadas
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
