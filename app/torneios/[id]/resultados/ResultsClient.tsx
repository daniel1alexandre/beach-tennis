"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Trophy,
  Flame,
  Search,
  Check,
  ShieldCheck,
  Clock,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { formatFullPairName, formatPairName } from "@/lib/tournament-engine/types";
import { MatchStatusLabels, MatchPhaseLabels } from "@/lib/enums";
import { getCategoryTheme } from "@/lib/category-colors";

export default function ResultsClient({
  tournamentId,
  categories,
  courts,
}: {
  tournamentId: string;
  categories: any[];
  courts: any[];
}) {
  const router = useRouter();
  const [selectedCatId, setSelectedCatId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tracks which finished matches are currently in edit mode
  const [unlockedEditMatchIds, setUnlockedEditMatchIds] = useState<Set<string>>(new Set());

  // Local state for score editing before saving
  const [editingScores, setEditingScores] = useState<
    Record<string, { scoreA: string | number; scoreB: string | number }>
  >({});

  const allMatches = categories.flatMap((c) => c.matches);

  const getScore = (m: any) => {
    if (editingScores[m.id]) return editingScores[m.id];
    return { scoreA: m.scoreA, scoreB: m.scoreB };
  };

  const updateScoreField = (matchId: string, side: "A" | "B", val: string) => {
    const current = getScore(allMatches.find((m) => m.id === matchId));
    setEditingScores({
      ...editingScores,
      [matchId]: {
        ...current,
        [side === "A" ? "scoreA" : "scoreB"]: val === "" ? "" : Math.max(0, parseInt(val) || 0),
      },
    });
  };

  const toggleEditMode = (matchId: string) => {
    setUnlockedEditMatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        next.add(matchId);
      }
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Submit Score / Status Update
  const handleUpdateMatch = async (
    matchId: string,
    newStatus?: string,
    forcedWinnerId?: string
  ) => {
    setSavingMatchId(matchId);
    const scores = getScore(allMatches.find((m) => m.id === matchId));
    const numA = Number(scores.scoreA) || 0;
    const numB = Number(scores.scoreB) || 0;

    try {
      const payload: any = {
        matchId,
        scoreA: numA,
        scoreB: numB,
        setsDetail: [{ set: 1, gamesA: numA, gamesB: numB }],
      };

      if (newStatus) payload.status = newStatus;
      if (forcedWinnerId) payload.winnerPairId = forcedWinnerId;

      const res = await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(
          newStatus === "FINISHED"
            ? "Partida homologada com sucesso!"
            : "Placar atualizado com sucesso!"
        );
        // Lock edit mode if was unlocked
        setUnlockedEditMatchIds((prev) => {
          const next = new Set(prev);
          next.delete(matchId);
          return next;
        });
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingMatchId(null);
    }
  };

  // Reset Match (Reabrir)
  const handleResetMatch = async (matchId: string) => {
    if (!window.confirm("Deseja reabrir este confronto e resetar o resultado?")) return;
    setSavingMatchId(matchId);

    try {
      const res = await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          scoreA: 0,
          scoreB: 0,
          status: "SCHEDULED",
          winnerPairId: null,
          setsDetail: [],
        }),
      });

      if (res.ok) {
        showToast("Confronto reaberto!");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingMatchId(null);
    }
  };

  // Filtering
  const filteredMatches = allMatches.filter((m) => {
    if (selectedCatId !== "ALL" && m.categoryId !== selectedCatId) return false;

    if (statusFilter === "LIVE" && m.status !== "LIVE" && m.status !== "WARMUP")
      return false;
    if (
      statusFilter === "FINISHED" &&
      m.status !== "FINISHED" &&
      !m.status.startsWith("WALKOVER")
    )
      return false;
    if (
      statusFilter === "PENDING" &&
      (m.status === "FINISHED" || m.status.startsWith("WALKOVER") || m.status === "LIVE")
    )
      return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nA = formatFullPairName(m.pairA).toLowerCase();
      const nB = formatFullPairName(m.pairB).toLowerCase();
      const cat = m.category.name.toLowerCase();
      return nA.includes(q) || nB.includes(q) || cat.includes(q);
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-[#00D2FF]" />
            Lançamento & Homologação de Resultados
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Registro game a game, clique limpo para digitação ágil e botão de edição direta
          </p>
        </div>

        {toastMessage && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4 text-[#00D2FF]" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Filters Strip */}
      <div className="p-4 rounded-2xl bg-[#0C1726] border border-[#162D4A] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        {/* Category Selector */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCatId("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
              selectedCatId === "ALL"
                ? "bg-[#00D2FF] text-[#060B12] font-black"
                : "bg-[#08111B] text-slate-400 hover:text-white border border-[#162D4A]"
            }`}
          >
            Todas ({allMatches.length})
          </button>
          {categories.map((c, idx) => {
            const theme = getCategoryTheme(c.name, idx);
            const isSelected = selectedCatId === c.id;

            return (
              <button
                key={c.id}
                onClick={() => setSelectedCatId(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${
                  isSelected
                    ? `${theme.badge} ring-2 ring-cyan-400/50 font-black`
                    : "bg-[#08111B] text-slate-400 hover:text-white border-[#162D4A]"
                }`}
              >
                {c.name} ({c.matches.length})
              </button>
            );
          })}
        </div>

        {/* Status Filters & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#08111B] border border-[#162D4A] rounded-xl p-1 text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                statusFilter === "ALL" ? "bg-cyan-500/20 text-[#00D2FF]" : "text-slate-400"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter("LIVE")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                statusFilter === "LIVE" ? "bg-cyan-500/20 text-[#00D2FF]" : "text-slate-400"
              }`}
            >
              Ao Vivo
            </button>
            <button
              onClick={() => setStatusFilter("FINISHED")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                statusFilter === "FINISHED" ? "bg-cyan-500/20 text-[#00D2FF]" : "text-slate-400"
              }`}
            >
              Concluídos
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                statusFilter === "PENDING" ? "bg-cyan-500/20 text-[#00D2FF]" : "text-slate-400"
              }`}
            >
              Pendentes
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar atleta/dupla..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#08111B] border border-[#162D4A] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs bg-[#0C1726] rounded-2xl border border-[#162D4A]">
            Nenhum jogo encontrado para os filtros selecionados.
          </div>
        ) : (
          filteredMatches.map((m, i) => {
            const theme = getCategoryTheme(m.category.name, i);
            const score = getScore(m);
            const isSaving = savingMatchId === m.id;
            const isFinished =
              m.status === "FINISHED" || m.status.startsWith("WALKOVER");
            const isLive = m.status === "LIVE" || m.status === "WARMUP";
            const isUnlockedForEdit = unlockedEditMatchIds.has(m.id);
            const canEditFields = !isFinished || isUnlockedForEdit;
            const winnerIsA = m.winnerPairId && m.winnerPairId === m.pairAId;
            const winnerIsB = m.winnerPairId && m.winnerPairId === m.pairBId;

            return (
              <div
                key={m.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isLive
                    ? "bg-[#0E1F35] border-cyan-500/70 shadow-lg shadow-cyan-950/30"
                    : isFinished
                    ? "bg-[#0A131F] border-[#162D4A]"
                    : "bg-[#0C1726] border-[#162D4A] hover:border-cyan-500/30"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info: Phase, Category, Court, Time */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${theme.badge}`}>
                        {m.category.name}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-300 font-semibold">
                        {m.groupId || MatchPhaseLabels[m.phase] || m.phase}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">
                        {m.court?.name || "Sem quadra definida"}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-[#00D2FF]" />
                      {m.scheduledTime
                        ? new Date(m.scheduledTime).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Horário N/D"}
                      {m.nextMatchId && (
                        <span className="ml-2 text-cyan-300/80">
                          (Chave avança para {MatchPhaseLabels[m.nextMatch?.phase || ""] || "Próxima Rodada"})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full border ${
                        isLive
                          ? "bg-cyan-500/20 text-[#00D2FF] border-cyan-500/50 animate-pulse"
                          : isFinished
                          ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {MatchStatusLabels[m.status] || m.status}
                    </span>
                  </div>
                </div>

                {/* Score Input Row */}
                <div className="mt-4 pt-4 border-t border-[#162D4A] grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Dupla A */}
                  <div className="lg:col-span-4 flex items-center justify-between bg-[#08111B] p-3 rounded-xl border border-[#162D4A]">
                    <div className="truncate pr-2">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Dupla A</span>
                      <span
                        className={`text-sm font-extrabold truncate block ${
                          winnerIsA ? "text-[#00D2FF]" : "text-white"
                        }`}
                      >
                        {formatFullPairName(m.pairA)}
                      </span>
                    </div>

                    {/* Score A input - Clean click-to-type, no +/- controls */}
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      disabled={!canEditFields}
                      value={score.scoreA}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateScoreField(m.id, "A", e.target.value)}
                      placeholder="0"
                      className="w-12 h-10 rounded-lg bg-[#0C1726] border border-[#1E3A5F] text-center font-mono font-black text-xl text-[#00D2FF] focus:outline-none focus:border-[#00D2FF] focus:ring-1 focus:ring-[#00D2FF] disabled:opacity-80 transition cursor-pointer [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  {/* Separator / VS */}
                  <div className="lg:col-span-1 text-center text-xs font-bold text-slate-500">
                    VS
                  </div>

                  {/* Dupla B */}
                  <div className="lg:col-span-4 flex items-center justify-between bg-[#08111B] p-3 rounded-xl border border-[#162D4A]">
                    <div className="truncate pr-2">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Dupla B</span>
                      <span
                        className={`text-sm font-extrabold truncate block ${
                          winnerIsB ? "text-[#00D2FF]" : "text-white"
                        }`}
                      >
                        {formatFullPairName(m.pairB)}
                      </span>
                    </div>

                    {/* Score B input - Clean click-to-type, no +/- controls */}
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      disabled={!canEditFields}
                      value={score.scoreB}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateScoreField(m.id, "B", e.target.value)}
                      placeholder="0"
                      className="w-12 h-10 rounded-lg bg-[#0C1726] border border-[#1E3A5F] text-center font-mono font-black text-xl text-[#00D2FF] focus:outline-none focus:border-[#00D2FF] focus:ring-1 focus:ring-[#00D2FF] disabled:opacity-80 transition cursor-pointer [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  {/* Actions: Salvar, Finalizar, Editar (W.O. removed!) */}
                  <div className="lg:col-span-3 flex items-center justify-end gap-2 flex-wrap">
                    {canEditFields ? (
                      <>
                        <button
                          onClick={() => handleUpdateMatch(m.id)}
                          disabled={isSaving}
                          className="px-3 py-2 rounded-xl bg-[#08111B] hover:bg-[#13253C] border border-[#162D4A] text-slate-200 text-xs font-bold transition disabled:opacity-50"
                          title="Salvar pontuação"
                        >
                          Salvar
                        </button>

                        <button
                          onClick={() => handleUpdateMatch(m.id, "FINISHED")}
                          disabled={isSaving}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#0099FF] hover:from-[#33DDFF] hover:to-[#1AA3FF] text-[#060B12] font-black text-xs transition shadow-sm disabled:opacity-50 flex items-center gap-1 active:scale-95"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Finalizar</span>
                        </button>

                        {isUnlockedForEdit && (
                          <button
                            onClick={() => toggleEditMode(m.id)}
                            className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                          >
                            Fechar
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Botão Editar (Requisito: colocar botão de editar) */}
                        <button
                          onClick={() => toggleEditMode(m.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-[#00D2FF] border border-cyan-500/30 text-xs font-bold transition"
                          title="Habilitar edição de placar deste confronto"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => handleResetMatch(m.id)}
                          disabled={isSaving}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                          title="Reabrir confronto"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
