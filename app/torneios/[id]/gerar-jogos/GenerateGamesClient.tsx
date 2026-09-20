"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  Play,
  Shuffle,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  Layers,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import {
  calculateGroupStandings,
  distributePairsIntoGroups,
} from "@/lib/tournament-engine/groups";
import { formatPairName } from "@/lib/tournament-engine/types";
import { MatchPhaseLabels } from "@/lib/enums";

export default function GenerateGamesClient({
  tournamentId,
  categories,
}: {
  tournamentId: string;
  categories: any[];
}) {
  const router = useRouter();
  const [selectedCatId, setSelectedCatId] = useState<string>(
    categories[0]?.id || ""
  );
  const [generationMode, setGenerationMode] = useState<"SERPENTINE" | "RANDOM">(
    "SERPENTINE"
  );
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [warningBypassNeeded, setWarningBypassNeeded] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const currentCategory = categories.find((c) => c.id === selectedCatId);

  const handleGenerate = async (
    action: "GROUPS" | "BRACKET",
    forceWarningBypass = false
  ) => {
    setLoading(true);
    setErrorBanner(null);
    setSuccessBanner(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCatId,
          action,
          mode: generationMode,
          forceWarningBypass,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setSuccessBanner(json.message);
        setWarningBypassNeeded(false);
        router.refresh();
      } else {
        setErrorBanner(json.error);
        if (json.requiresWarningBypass) {
          setWarningBypassNeeded(true);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorBanner("Erro ao processar chaveamento.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentCategory) {
    return (
      <div className="p-8 text-center text-zinc-400">
        Nenhuma categoria cadastrada. Crie uma categoria primeiro.
      </div>
    );
  }

  // Calculate Group Stage standings
  const groupMatches = currentCategory.matches.filter(
    (m: any) => m.phase === "GROUP_STAGE"
  );
  const bracketMatches = currentCategory.matches.filter(
    (m: any) => m.phase !== "GROUP_STAGE"
  );

  const groupNames = Array.from(
    new Set(groupMatches.map((m: any) => m.groupId).filter(Boolean))
  ) as string[];

  // Split bracket matches by phase
  const qfMatches = bracketMatches.filter(
    (m: any) => m.phase === "QUARTERFINALS"
  );
  const semiMatches = bracketMatches.filter(
    (m: any) => m.phase === "SEMIFINALS"
  );
  const finalMatches = bracketMatches.filter((m: any) => m.phase === "FINAL");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-emerald-400" />
            Gerador de Jogos & Chaveamento
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Sorteio com distribuição em serpentina ou aleatório, e chave mata-mata padrão CBT/ITF
          </p>
        </div>
      </div>

      {/* Category Selection Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCatId(cat.id);
              setErrorBanner(null);
              setSuccessBanner(null);
              setWarningBypassNeeded(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCatId === cat.id
                ? "bg-[#00D2FF] text-[#060B12] font-black shadow-md shadow-cyan-500/20"
                : "bg-[#0C1726] text-slate-400 border border-[#162D4A] hover:text-slate-200"
            }`}
          >
            {cat.name} ({cat.pairs.length} duplas)
          </button>
        ))}
      </div>

      {/* Alerts */}
      {errorBanner && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorBanner}</span>
          </div>

          {warningBypassNeeded && (
            <button
              onClick={() => handleGenerate("BRACKET", true)}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              Forçar Chaveamento Mata-Mata (Bypass RN-005)
            </button>
          )}
        </div>
      )}

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#00D2FF] shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Action Strip */}
      <div className="p-5 rounded-2xl bg-[#0C1726] border border-[#162D4A] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div>
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00D2FF]" />
            Configuração de Sorteio: {currentCategory.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {currentCategory.pairs.length} duplas inscritas • {currentCategory.groupCount} grupos previstos • avança top {currentCategory.advancePerGroup}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-[#08111B] border border-[#162D4A] rounded-xl p-1 text-xs">
            <button
              onClick={() => setGenerationMode("SERPENTINE")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                generationMode === "SERPENTINE"
                  ? "bg-[#00D2FF] text-[#060B12] font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Serpentina (Cabeças)
            </button>
            <button
              onClick={() => setGenerationMode("RANDOM")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                generationMode === "RANDOM"
                  ? "bg-[#00D2FF] text-[#060B12] font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sorteio Aleatório
            </button>
          </div>

          <button
            onClick={() => handleGenerate("GROUPS")}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#0099FF] hover:from-[#33DDFF] hover:to-[#1AA3FF] text-[#060B12] font-black text-xs transition shadow-md shadow-cyan-500/20 disabled:opacity-50 active:scale-95"
          >
            {loading ? "Gerando..." : "Gerar / Sortear Grupos"}
          </button>

          <button
            onClick={() => handleGenerate("BRACKET")}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-[#08111B] hover:bg-[#13253C] border border-cyan-500/40 text-[#00D2FF] font-black text-xs transition disabled:opacity-50"
          >
            {loading ? "Processando..." : "Gerar Chave Mata-Mata"}
          </button>
        </div>
      </div>

      {/* 1. SEÇÃO DE GRUPOS & TABELAS DE CLASSIFICAÇÃO (RN-004) */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#00D2FF]" />
          Fase de Grupos & Classificação Automática (RN-004)
        </h3>

        {groupNames.length === 0 ? (
          <div className="p-8 text-center bg-[#08111B] rounded-2xl border border-dashed border-[#162D4A] text-slate-500 text-xs">
            Nenhum grupo gerado para esta categoria ainda. Clique em "Gerar / Sortear Grupos" acima.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {groupNames.map((gName) => {
              const matchesInGroup = groupMatches.filter(
                (m: any) => m.groupId === gName
              );
              const pairsInGroup = currentCategory.pairs.filter((p: any) =>
                matchesInGroup.some(
                  (m: any) => m.pairAId === p.id || m.pairBId === p.id
                )
              );

              const standings = calculateGroupStandings(
                pairsInGroup,
                matchesInGroup,
                currentCategory.advancePerGroup
              );

              return (
                <div
                  key={gName}
                  className="p-5 rounded-2xl bg-[#0C1726] border border-[#162D4A] space-y-4 shadow-lg hover:border-cyan-500/30 transition"
                >
                  <div className="flex items-center justify-between border-b border-[#162D4A] pb-3">
                    <span className="font-black text-sm text-white uppercase tracking-wider">
                      {gName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {matchesInGroup.filter((m: any) => m.status === "FINISHED").length}/{matchesInGroup.length} jogos finalizados
                    </span>
                  </div>

                  {/* Tabela de Classificação */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#08111B] text-slate-400 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-2.5">Pos</th>
                          <th className="py-2 px-2.5">Dupla</th>
                          <th className="py-2 px-1 text-center" title="Jogos">J</th>
                          <th className="py-2 px-1 text-center text-[#00D2FF]" title="Vitórias">V</th>
                          <th className="py-2 px-1 text-center" title="Derrotas">D</th>
                          <th className="py-2 px-1 text-center" title="Saldo de Sets">SG</th>
                          <th className="py-2 px-1 text-center" title="Saldo de Games">Saldo</th>
                          <th className="py-2 px-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#13253C]">
                        {standings.map((st) => (
                          <tr
                            key={st.pairId}
                            className={`hover:bg-[#0E1F35]/50 ${
                              st.qualified ? "bg-cyan-950/20" : ""
                            }`}
                          >
                            <td className="py-2.5 px-2.5 font-bold font-mono">
                              <span
                                className={`w-5 h-5 rounded-md inline-flex items-center justify-center text-[10px] ${
                                  st.qualified
                                    ? "bg-[#00D2FF] text-[#060B12] font-black"
                                    : "text-slate-400"
                                }`}
                              >
                                {st.position}º
                              </span>
                            </td>
                            <td className="py-2.5 px-2.5 font-extrabold text-white">
                              {st.pairName}
                              {st.seed && (
                                <span className="ml-1 text-[9px] text-amber-400 font-normal">
                                  (Cabeça #{st.seed})
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-1 text-center font-mono text-slate-400">
                              {st.played}
                            </td>
                            <td className="py-2.5 px-1 text-center font-mono font-bold text-[#00D2FF]">
                              {st.won}
                            </td>
                            <td className="py-2.5 px-1 text-center font-mono text-slate-400">
                              {st.lost}
                            </td>
                            <td className="py-2.5 px-1 text-center font-mono text-slate-300">
                              {st.setsDiff > 0 ? `+${st.setsDiff}` : st.setsDiff}
                            </td>
                            <td className="py-2.5 px-1 text-center font-mono text-slate-300">
                              {st.gamesDiff > 0 ? `+${st.gamesDiff}` : st.gamesDiff}
                            </td>
                            <td className="py-2.5 px-2.5 text-center">
                              {st.qualified ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40">
                                  Classificado
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">
                                  Fase de Grupo
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Lista de Partidas do Grupo */}
                  <div className="pt-3 border-t border-[#162D4A] space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      Confrontos do {gName}
                    </span>
                    {matchesInGroup.map((m: any) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#08111B] border border-[#162D4A] text-xs"
                      >
                        <div className="truncate pr-2 font-medium text-slate-200">
                          {formatPairName(m.pairA)} vs {formatPairName(m.pairB)}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono">
                          <span className="font-bold text-[#00D2FF]">
                            {m.scoreA} × {m.scoreB}
                          </span>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                              m.status === "FINISHED"
                                ? "bg-slate-800 text-slate-400"
                                : m.status === "LIVE"
                                ? "bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40 font-bold"
                                : "bg-[#0C1726] text-slate-400"
                            }`}
                          >
                            {m.status === "FINISHED"
                              ? "Fim"
                              : m.status === "LIVE"
                              ? "Ao Vivo"
                              : "Agendado"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. SEÇÃO DE CHAVE MATA-MATA (BRACKET TREE) */}
      <div className="p-6 rounded-2xl bg-[#0C1726] border border-[#162D4A] space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#162D4A] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-[#00D2FF]" />
              Diagrama do Chaveamento Mata-Mata (Brackets)
            </h3>
            <p className="text-xs text-slate-400">
              Chave eliminatória simples com cruzamento de 1º vs 2º de grupos distintos
            </p>
          </div>

          <button
            onClick={() => handleGenerate("BRACKET")}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00D2FF] border border-cyan-500/40 text-xs font-bold transition"
          >
            Regerar Chave Mata-Mata
          </button>
        </div>

        {bracketMatches.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            Nenhuma chave mata-mata gerada para esta categoria ainda. Conclua os jogos de grupo e clique em "Gerar Chave Mata-Mata".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-4">
            {/* Quartas de Final (se houver) */}
            {qfMatches.length > 0 && (
              <div className="space-y-4">
                <div className="text-xs font-black uppercase text-[#00D2FF] tracking-wider">
                  Quartas de Final ({qfMatches.length} jogos)
                </div>
                <div className="space-y-3">
                  {qfMatches.map((m: any) => (
                    <BracketCard key={m.id} match={m} />
                  ))}
                </div>
              </div>
            )}

            {/* Semifinais */}
            <div className="space-y-4">
              <div className="text-xs font-black uppercase text-[#00D2FF] tracking-wider">
                Semifinais ({semiMatches.length} jogos)
              </div>
              <div className="space-y-3">
                {semiMatches.map((m: any) => (
                  <BracketCard key={m.id} match={m} />
                ))}
              </div>
            </div>

            {/* Grande Final */}
            <div className="space-y-4">
              <div className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                Grande Final & Campeão
              </div>
              <div className="space-y-3">
                {finalMatches.map((m: any) => (
                  <BracketCard key={m.id} match={m} isFinal />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BracketCard({ match, isFinal }: { match: any; isFinal?: boolean }) {
  const isWinnerA = match.winnerPairId && match.winnerPairId === match.pairAId;
  const isWinnerB = match.winnerPairId && match.winnerPairId === match.pairBId;

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        isFinal
          ? "bg-[#101F33] border-amber-500/50 shadow-lg shadow-amber-950/20"
          : "bg-[#08111B] border-[#162D4A] hover:border-cyan-500/40"
      }`}
    >
      <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold mb-2">
        <span>
          {isFinal
            ? "Disputa do Título"
            : `${MatchPhaseLabels[match.phase] || match.phase} #${match.positionInBracket}`}
        </span>
        <span
          className={`px-1.5 py-0.5 rounded font-bold ${
            match.status === "FINISHED"
              ? "bg-slate-800 text-slate-400"
              : match.status === "LIVE"
              ? "bg-cyan-500/20 text-[#00D2FF]"
              : "bg-[#0C1726] text-slate-400"
          }`}
        >
          {match.status === "FINISHED"
            ? "Concluído"
            : match.status === "LIVE"
            ? "Ao Vivo"
            : "Aguardando"}
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        {/* Dupla A */}
        <div
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${
            isWinnerA
              ? "bg-cyan-500/15 border-cyan-500/40 text-white font-extrabold"
              : "bg-[#0C1726] border-[#162D4A] text-slate-300"
          }`}
        >
          <span className="truncate pr-2">{formatPairName(match.pairA)}</span>
          <span className="font-mono font-bold text-[#00D2FF]">
            {match.scoreA}
          </span>
        </div>

        {/* Dupla B */}
        <div
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${
            isWinnerB
              ? "bg-cyan-500/15 border-cyan-500/40 text-white font-extrabold"
              : "bg-[#0C1726] border-[#162D4A] text-slate-300"
          }`}
        >
          <span className="truncate pr-2">{formatPairName(match.pairB)}</span>
          <span className="font-mono font-bold text-[#00D2FF]">
            {match.scoreB}
          </span>
        </div>
      </div>
    </div>
  );
}
