"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Printer,
  FileSpreadsheet,
  Search,
  AlertTriangle,
  CheckCircle2,
  Tv,
  Layers,
  Users,
  MapPin,
  Move,
  X,
  GripVertical,
  Zap,
  Sparkles,
  Share2,
  Copy,
  Check,
  Filter,
} from "lucide-react";
import { formatPairName, formatFullPairName } from "@/lib/tournament-engine/types";
import { MatchStatusLabels, MatchPhaseLabels } from "@/lib/enums";
import { checkMatchTimeConflicts } from "@/lib/tournament-engine/conflicts";
import { getCategoryTheme } from "@/lib/category-colors";

export default function ScheduleClient({
  tournament,
  allAthletes,
}: {
  tournament: any;
  allAthletes: any[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "category" | "athlete" | "official">("general");

  // Filter category in general tab ("all" or categoryId)
  const [generalFilterCatId, setGeneralFilterCatId] = useState<string>("all");

  // Selected category in category tab
  const [selectedCatId, setSelectedCatId] = useState<string>(
    tournament.categories[0]?.id || ""
  );

  // Search athlete/pair
  const [searchAthleteQuery, setSearchAthleteQuery] = useState("");

  // Reassignment modal
  const [reassignMatch, setReassignMatch] = useState<any | null>(null);
  const [targetCourtId, setTargetCourtId] = useState("");
  const [targetTime, setTargetTime] = useState("");
  const [savingReassign, setSavingReassign] = useState(false);

  // Pre-allocation state
  const [isPreallocating, setIsPreallocating] = useState(false);
  const [preallocSuccessMsg, setPreallocSuccessMsg] = useState<string | null>(null);

  // Drag and drop state
  const [draggedMatch, setDraggedMatch] = useState<any | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [dragSuccessMsg, setDragSuccessMsg] = useState<string | null>(null);

  // WhatsApp copy state
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  const allMatches = tournament.categories.flatMap((cat: any) => cat.matches);
  const courts = tournament.courts;

  // Group matches into time slots for the matrix
  const timeSlots = Array.from(
    new Set(
      allMatches
        .map((m: any) =>
          m.scheduledTime
            ? new Date(m.scheduledTime).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null
        )
        .filter(Boolean)
    )
  ).sort() as string[];

  // If no time slots, create sample default slots (08:00, 08:45, 09:30, etc.)
  const effectiveTimeSlots =
    timeSlots.length > 0
      ? timeSlots
      : ["08:00", "08:45", "09:30", "10:15", "11:00", "11:45", "14:00", "14:45", "15:30"];

  // Filter matches for general matrix if a specific category is chosen
  const filteredGeneralMatches =
    generalFilterCatId === "all"
      ? allMatches
      : allMatches.filter((m: any) => m.categoryId === generalFilterCatId);

  // Trigger Automatic Pre-allocation
  const handlePreallocate = async (categoryId?: string) => {
    setIsPreallocating(true);
    setPreallocSuccessMsg(null);
    try {
      const res = await fetch("/api/schedule/preallocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: tournament.id,
          categoryId: categoryId || (generalFilterCatId !== "all" ? generalFilterCatId : undefined),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPreallocSuccessMsg(data.message || "Partidas pré-alocadas com sucesso!");
        setTimeout(() => setPreallocSuccessMsg(null), 4500);
        router.refresh();
      } else {
        alert(data.error || "Erro ao pré-alocar");
      }
    } catch (err) {
      console.error(err);
      alert("Falha na comunicação com o servidor.");
    } finally {
      setIsPreallocating(false);
    }
  };

  // Handle Match Reassignment (RF-013)
  const handleSaveReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignMatch) return;

    setSavingReassign(true);
    try {
      const updateData: any = {
        matchId: reassignMatch.id,
        courtId: targetCourtId || null,
      };

      if (targetTime) {
        const baseDate = reassignMatch.scheduledTime
          ? new Date(reassignMatch.scheduledTime)
          : new Date(tournament.startDate);
        const [hours, mins] = targetTime.split(":");
        baseDate.setHours(parseInt(hours), parseInt(mins), 0);
        updateData.scheduledTime = baseDate.toISOString();
      }

      const res = await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        setReassignMatch(null);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingReassign(false);
    }
  };

  // Drag and Drop handler: Arrastar para o local ideal (RF-013)
  const handleDropOnSlot = async (courtId: string, timeStr: string) => {
    if (!draggedMatch) return;

    try {
      const baseDate = draggedMatch.scheduledTime
        ? new Date(draggedMatch.scheduledTime)
        : new Date(tournament.startDate);
      const [hours, mins] = timeStr.split(":");
      baseDate.setHours(parseInt(hours), parseInt(mins), 0);

      const targetCourt = courts.find((c: any) => c.id === courtId);
      const pairNames = `${formatPairName(draggedMatch.pairA)} vs ${formatPairName(draggedMatch.pairB)}`;

      const res = await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: draggedMatch.id,
          courtId,
          scheduledTime: baseDate.toISOString(),
        }),
      });

      if (res.ok) {
        setDragSuccessMsg(
          `Jogo (${pairNames}) movido com sucesso para ${targetCourt?.name || "Quadra"} às ${timeStr}!`
        );
        setTimeout(() => setDragSuccessMsg(null), 3500);
        setDraggedMatch(null);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered athlete matches (RF-014)
  const athleteMatches = allMatches.filter((m: any) => {
    if (!searchAthleteQuery.trim()) return false;
    const q = searchAthleteQuery.toLowerCase();
    const a1A = m.pairA?.athlete1?.fullName?.toLowerCase() || "";
    const a2A = m.pairA?.athlete2?.fullName?.toLowerCase() || "";
    const a1B = m.pairB?.athlete1?.fullName?.toLowerCase() || "";
    const a2B = m.pairB?.athlete2?.fullName?.toLowerCase() || "";
    return (
      a1A.includes(q) || a2A.includes(q) || a1B.includes(q) || a2B.includes(q)
    );
  });

  // Calculate official schedule summary by category
  const officialCategorySchedule = tournament.categories.map((cat: any, idx: number) => {
    const catTheme = getCategoryTheme(cat.name, idx, cat.color);
    const catMatchesWithTime = cat.matches
      .filter((m: any) => m.scheduledTime)
      .sort(
        (a: any, b: any) =>
          new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
      );

    const firstMatchTime = catMatchesWithTime[0]
      ? new Date(catMatchesWithTime[0].scheduledTime).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "A definir";

    const lastMatchTime = catMatchesWithTime[catMatchesWithTime.length - 1]
      ? new Date(
          catMatchesWithTime[catMatchesWithTime.length - 1].scheduledTime
        ).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "A definir";

    const allocatedCourtNames = Array.from(
      new Set(
        cat.matches
          .map((m: any) => m.court?.name)
          .filter(Boolean)
      )
    ).join(", ") || "Quadras a definir";

    return {
      category: cat,
      theme: catTheme,
      startTime: firstMatchTime,
      estimatedEndTime: lastMatchTime,
      totalPairs: cat.pairs.length,
      totalMatches: cat.matches.length,
      courtsText: allocatedCourtNames,
      firstMatches: catMatchesWithTime.slice(0, 3),
    };
  });

  // Copy to WhatsApp
  const handleCopyWhatsapp = () => {
    const lines = [
      `🎾 *${tournament.name.toUpperCase()}* 🎾`,
      `📅 *PROGRAMAÇÃO OFICIAL - HORÁRIOS DE INÍCIO POR CATEGORIA*`,
      `📍 Local: ${tournament.location}`,
      `----------------------------------------`,
      ...officialCategorySchedule.map((item: any) => {
        return `🏆 *${item.category.name}*\n⏰ *Horário de Início:* ${item.startTime}\n👥 Duplas: ${item.totalPairs} | 🏟️ ${item.courtsText}\n`;
      }),
      `----------------------------------------`,
      `⚠️ *Orientações aos Atletas:*`,
      `• Chegar com 30 minutos de antecedência ao horário previsto.`,
      `• Aquecimento em quadra: máximo de 5 minutos.`,
      `• Acompanhe o telão ao vivo e chamadas de quadra.`,
      `Boa sorte a todos os atletas! 🚀🔥`,
    ];

    const fullText = lines.join("\n");
    navigator.clipboard.writeText(fullText);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#00D2FF]" />
            Programação & Grade Horária
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Matriz de horários com cores por categoria, pré-alocação automática e divulgação oficial aos atletas
          </p>
        </div>

        {/* Actions (Printer & CSV export - JSON backup removed) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0C1726] hover:bg-[#13253C] border border-[#162D4A] text-slate-200 text-xs font-bold transition shadow-sm"
            title="Imprimir grade formatada em PDF"
          >
            <Printer className="w-4 h-4 text-[#00D2FF]" />
            <span>Imprimir / PDF</span>
          </button>

          <a
            href={`/api/export?tournamentId=${tournament.id}&format=csv`}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0C1726] hover:bg-[#13253C] border border-[#162D4A] text-slate-200 text-xs font-bold transition shadow-sm"
            title="Exportar jogos em CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#00D2FF]" />
            <span>Exportar CSV</span>
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-[#162D4A] pb-2 no-print overflow-x-auto">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "general"
              ? "bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40 shadow-sm shadow-cyan-950/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Grade Geral (Horários × Quadras)
        </button>

        <button
          onClick={() => setActiveTab("official")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "official"
              ? "bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40 shadow-sm shadow-cyan-950/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#00D2FF]" />
          Divulgação Oficial (Início por Categoria)
        </button>

        <button
          onClick={() => setActiveTab("category")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "category"
              ? "bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40 shadow-sm shadow-cyan-950/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Por Categoria
        </button>

        <button
          onClick={() => setActiveTab("athlete")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "athlete"
              ? "bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40 shadow-sm shadow-cyan-950/40"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Linha do Tempo por Atleta / Dupla
        </button>
      </div>

      {/* TAB 1: GRADE GERAL (MATRIZ HORÁRIOS X QUADRAS) */}
      {activeTab === "general" && (
        <div className="space-y-4">
          {/* Notification Messages */}
          {dragSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#00D2FF] shrink-0" />
              <span>{dragSuccessMsg}</span>
            </div>
          )}

          {preallocSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-[#00D2FF] text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Zap className="w-4 h-4 text-[#00D2FF] shrink-0" />
              <span>{preallocSuccessMsg}</span>
            </div>
          )}

          {/* Action & Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-[#0C1726] border border-[#162D4A] flex flex-col lg:flex-row lg:items-center justify-between gap-3 no-print shadow-md">
            {/* Category Filter Pills / Dropdown */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#00D2FF]" />
                Filtrar Categoria:
              </span>

              <button
                onClick={() => setGeneralFilterCatId("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  generalFilterCatId === "all"
                    ? "bg-[#00D2FF] text-[#060B12] font-black"
                    : "bg-[#08111B] text-slate-300 hover:text-white border border-[#162D4A]"
                }`}
              >
                Todas ({allMatches.length})
              </button>

              {tournament.categories.map((cat: any, idx: number) => {
                const theme = getCategoryTheme(cat.name, idx);
                const isSelected = generalFilterCatId === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setGeneralFilterCatId(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                      isSelected
                        ? `${theme.badge} ring-2 ring-cyan-400/50 font-black`
                        : "bg-[#08111B] border-[#162D4A] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${theme.indicator}`} />
                    <span>{cat.name}</span>
                    <span className="text-[10px] opacity-70">({cat.matches.length})</span>
                  </button>
                );
              })}
            </div>

            {/* Pre-allocate Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePreallocate()}
                disabled={isPreallocating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#0099FF] hover:from-[#33DDFF] hover:to-[#1AA3FF] text-[#060B12] font-black text-xs transition shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
                title="Distribui os confrontos automaticamente pelas quadras e blocos de horários"
              >
                <Zap className={`w-4 h-4 ${isPreallocating ? "animate-spin" : ""}`} />
                <span>
                  {isPreallocating
                    ? "Pré-alocando..."
                    : generalFilterCatId === "all"
                    ? "Pré-alocar Todos os Jogos"
                    : "Pré-alocar Categoria Selecionada"}
                </span>
              </button>
            </div>
          </div>

          {/* Drag and Drop instructions banner */}
          <div className="p-3.5 rounded-xl bg-[#0B1523] border border-[#162D4A] flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-[#00D2FF]" />
              <span>
                🖐️ <strong>Organização por Drag & Drop:</strong> Arraste qualquer jogo da bandeja ou da tabela para reagendar individualmente para a quadra e horário ideais.
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#00D2FF] font-bold shrink-0 hidden sm:inline">
              {filteredGeneralMatches.length} jogos exibidos
            </span>
          </div>

          {/* Bandeja de Jogos da Fila para Arrastar */}
          {(() => {
            const queueMatches = filteredGeneralMatches.filter(
              (m: any) => !m.courtId || m.status === "WAITING_COURT"
            );
            if (queueMatches.length === 0) return null;

            return (
              <div className="p-4 rounded-2xl bg-[#0C1726] border border-cyan-500/30 space-y-2.5 no-print shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#00D2FF] flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5" />
                    Jogos Aguardando Alocação ({queueMatches.length}) — Arraste para a grade abaixo:
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Segure e solte sobre qualquer horário/quadra
                  </span>
                </div>

                <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                  {queueMatches.map((m: any, i: number) => {
                    const theme = getCategoryTheme(m.category?.name, i, m.category?.color);
                    return (
                      <div
                        key={m.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", m.id);
                          setDraggedMatch(m);
                        }}
                        onDragEnd={() => {
                          setDraggedMatch(null);
                          setDragOverTarget(null);
                        }}
                        className={`p-2.5 rounded-xl ${theme.bg} hover:brightness-125 border ${theme.border} text-xs shrink-0 cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-all shadow-sm group min-w-[220px]`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                          <span className={`px-1.5 py-0.5 rounded ${theme.badge}`}>
                            {m.category.name}
                          </span>
                          <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                        </div>
                        <div className="font-black text-white text-[11px] truncate">
                          {formatPairName(m.pairA)}
                        </div>
                        <div className="text-[9px] text-slate-500">vs</div>
                        <div className="font-black text-white text-[11px] truncate">
                          {formatPairName(m.pairB)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Matriz Geral de Horários × Quadras */}
          <div className="overflow-x-auto rounded-2xl border border-[#162D4A] bg-[#09111C] shadow-xl">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              {/* Header: Quadras (Eixo X) */}
              <thead>
                <tr className="bg-[#0C1726] border-b-2 border-[#162D4A] text-slate-300">
                  <th className="py-3 px-4 w-24 font-black uppercase tracking-wider text-[#00D2FF] border-r border-[#162D4A]">
                    Horário
                  </th>
                  {courts.map((court: any) => (
                    <th
                      key={court.id}
                      className="py-3 px-4 font-black uppercase tracking-wider border-r border-[#162D4A] last:border-r-0 min-w-[180px]"
                    >
                      <div className="flex items-center justify-between">
                        <span>{court.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            court.status === "OCCUPIED"
                              ? "bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {court.status === "OCCUPIED" ? "AO VIVO" : "LIVRE"}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Rows: Horários (Eixo Y) */}
              <tbody className="divide-y divide-[#13253C]">
                {effectiveTimeSlots.map((timeStr) => {
                  return (
                    <tr key={timeStr} className="hover:bg-[#0E1D31]/40">
                      {/* Horário Header (Eixo Y) */}
                      <td className="py-3 px-4 font-mono font-black text-white bg-[#0A121E] border-r border-[#162D4A]">
                        {timeStr}
                      </td>

                      {/* Quadras Columns */}
                      {courts.map((court: any) => {
                        const targetKey = `${court.id}_${timeStr}`;
                        const isDragOver = dragOverTarget === targetKey;

                        // Find match at this time on this court within filtered matches
                        const match = filteredGeneralMatches.find((m: any) => {
                          if (m.courtId !== court.id) return false;
                          if (!m.scheduledTime) return false;
                          const mTime = new Date(m.scheduledTime).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" }
                          );
                          return mTime === timeStr;
                        });

                        const theme = match
                          ? getCategoryTheme(match.category?.name, 0, match.category?.color)
                          : null;

                        return (
                          <td
                            key={court.id}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "move";
                              setDragOverTarget(targetKey);
                            }}
                            onDragLeave={() => {
                              if (dragOverTarget === targetKey) {
                                setDragOverTarget(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverTarget(null);
                              handleDropOnSlot(court.id, timeStr);
                            }}
                            className={`p-2 border-r border-[#162D4A] last:border-r-0 align-top transition-all ${
                              isDragOver
                                ? "bg-cyan-500/25 border-2 border-dashed border-[#00D2FF] shadow-inner"
                                : ""
                            }`}
                          >
                            {match && theme ? (
                              <div
                                draggable={match.status !== "FINISHED"}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("text/plain", match.id);
                                  setDraggedMatch(match);
                                }}
                                onDragEnd={() => {
                                  setDraggedMatch(null);
                                  setDragOverTarget(null);
                                }}
                                className={`p-2.5 rounded-xl border relative group transition-all ${
                                  match.status !== "FINISHED"
                                    ? "cursor-grab active:cursor-grabbing hover:scale-[1.01]"
                                    : ""
                                } ${theme.bg} ${theme.border} shadow-sm`}
                              >
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                  <div className="flex items-center gap-1.5">
                                    {match.status !== "FINISHED" && (
                                      <GripVertical className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
                                    )}
                                    <span className={`px-1.5 py-0.5 rounded font-bold ${theme.badge}`}>
                                      {match.category.name}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setReassignMatch(match);
                                      setTargetCourtId(match.courtId || "");
                                      setTargetTime(timeStr);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-700 text-slate-300 transition no-print"
                                    title="Remanejar Quadra/Horário"
                                  >
                                    <Move className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="font-extrabold text-white text-[11px] leading-snug truncate">
                                  {formatPairName(match.pairA)}
                                </div>
                                <div className="text-[10px] text-slate-500">vs</div>
                                <div className="font-extrabold text-white text-[11px] leading-snug truncate">
                                  {formatPairName(match.pairB)}
                                </div>

                                <div className="mt-2 pt-1 border-t border-[#162D4A]/50 flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-slate-300 font-bold">
                                    {match.status === "FINISHED"
                                      ? `${match.scoreA} × ${match.scoreB}`
                                      : MatchStatusLabels[match.status] || match.status}
                                  </span>
                                  <span className="text-slate-400">
                                    {match.groupId || MatchPhaseLabels[match.phase] || match.phase}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`h-16 rounded-xl border border-dashed flex items-center justify-center text-[10px] transition-all ${
                                  isDragOver
                                    ? "border-[#00D2FF] bg-cyan-500/20 text-[#00D2FF] font-bold"
                                    : "border-[#13253C] text-slate-600 hover:border-slate-600"
                                }`}
                              >
                                {isDragOver ? "Solte aqui" : "—"}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DIVULGAÇÃO OFICIAL (HORÁRIO DE INÍCIO DE CADA CATEGORIA) */}
      {activeTab === "official" && (
        <div className="space-y-6">
          {/* Header Card with Copy to WhatsApp */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0C192E] via-[#0D213F] to-[#081220] border border-[#163359] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40 text-xs font-black uppercase tracking-wider">
                  Divulgação aos Atletas
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(tournament.startDate).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Grade de Horários de Início por Categoria
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Informações oficiais para os atletas se programarem com antecedência e comparecerem no horário.
              </p>
            </div>

            <div className="flex items-center gap-3 no-print">
              <button
                onClick={handleCopyWhatsapp}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#0099FF] hover:from-[#33DDFF] hover:to-[#1AA3FF] text-[#060B12] font-black text-xs transition shadow-lg shadow-cyan-500/30 active:scale-95"
              >
                {copiedWhatsapp ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Copiar Comunicado (WhatsApp)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0C1726] hover:bg-[#13253C] border border-[#162D4A] text-slate-200 text-xs font-bold transition"
              >
                <Printer className="w-4 h-4 text-[#00D2FF]" />
                <span>Imprimir Mural</span>
              </button>
            </div>
          </div>

          {/* Cards Grid by Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {officialCategorySchedule.map((item: any) => {
              return (
                <div
                  key={item.category.id}
                  className={`p-5 rounded-2xl bg-[#0C1726] border ${item.theme.border} shadow-lg space-y-4 hover:border-cyan-400/60 transition`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${item.theme.badge}`}>
                      {item.category.name}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-[#08111B] px-2 py-0.5 rounded border border-[#162D4A]">
                      {item.category.type}
                    </span>
                  </div>

                  {/* Start Time Highlight */}
                  <div className="p-4 rounded-xl bg-[#08111B] border border-[#162D4A] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                        Horário de Início Oficial
                      </span>
                      <span className={`text-2xl font-black ${item.theme.text} font-mono mt-0.5 block`}>
                        {item.startTime}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                        Previsão de Término
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-300 mt-0.5 block">
                        {item.estimatedEndTime}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Specs */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between py-1 border-b border-[#162D4A]">
                      <span className="text-slate-400">Total de Duplas:</span>
                      <span className="font-bold text-white">{item.totalPairs} duplas ({item.totalPairs * 2} atletas)</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#162D4A]">
                      <span className="text-slate-400">Total de Jogos:</span>
                      <span className="font-bold text-white">{item.totalMatches} partidas</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-400">Quadras Previstas:</span>
                      <span className="font-bold text-[#00D2FF] truncate max-w-[150px]">{item.courtsText}</span>
                    </div>
                  </div>

                  {/* First Scheduled Matches Preview */}
                  {item.firstMatches.length > 0 && (
                    <div className="pt-2 border-t border-[#162D4A]">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1.5">
                        Primeiros Confrontos da Categoria:
                      </span>
                      <div className="space-y-1.5">
                        {item.firstMatches.map((m: any) => (
                          <div
                            key={m.id}
                            className="p-2 rounded-lg bg-[#08111B] text-[11px] flex items-center justify-between border border-[#162D4A]"
                          >
                            <span className="text-white font-bold truncate max-w-[180px]">
                              {formatPairName(m.pairA)} vs {formatPairName(m.pairB)}
                            </span>
                            <span className="font-mono text-[#00D2FF] font-bold shrink-0 ml-2">
                              {new Date(m.scheduledTime).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: POR CATEGORIA */}
      {activeTab === "category" && (
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {tournament.categories.map((cat: any, idx: number) => {
              const theme = getCategoryTheme(cat.name, idx);
              const isSelected = selectedCatId === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border ${
                    isSelected
                      ? `${theme.badge} ring-2 ring-cyan-400/60 font-black shadow-md`
                      : "bg-[#0C1726] text-slate-400 border-[#162D4A] hover:text-slate-200"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${theme.indicator}`} />
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-70">({cat.matches.length} jogos)</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {tournament.categories
              .find((c: any) => c.id === selectedCatId)
              ?.matches.map((m: any, i: number) => {
                const theme = getCategoryTheme(m.category?.name, i, m.category?.color);
                const time = m.scheduledTime
                  ? new Date(m.scheduledTime).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "A definir";

                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl bg-[#0C1726] border ${theme.border} flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-400/50 transition`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 text-center">
                        <span className="font-mono font-black text-white text-xs block">
                          {time}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {m.court ? m.court.name : "Quadra N/D"}
                        </span>
                      </div>

                      <div className="border-l border-[#162D4A] pl-3">
                        <span className={`text-[10px] font-bold uppercase ${theme.text} block`}>
                          {m.groupId || MatchPhaseLabels[m.phase]}
                        </span>
                        <div className="text-sm font-extrabold text-white">
                          {formatFullPairName(m.pairA)} <span className="text-slate-500 font-normal">vs.</span> {formatFullPairName(m.pairB)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="font-mono text-sm font-black text-[#00D2FF]">
                        {m.scoreA} × {m.scoreB}
                      </div>

                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          m.status === "LIVE"
                            ? "bg-cyan-500/20 text-[#00D2FF] border border-cyan-500/40"
                            : m.status === "FINISHED"
                            ? "bg-slate-800 text-slate-400"
                            : "bg-[#08111B] text-slate-300"
                        }`}
                      >
                        {MatchStatusLabels[m.status] || m.status}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 4: LINHA DO TEMPO POR ATLETA / DUPLA */}
      {activeTab === "athlete" && (
        <div className="p-6 rounded-2xl bg-[#0C1726] border border-[#162D4A] space-y-5">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-[#00D2FF]" />
              Busca de Linha do Tempo & Validação de Conflitos
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Digite o nome do atleta para visualizar toda a sua grade de jogos no evento e verificar sobreposições
            </p>
          </div>

          <div className="relative max-w-lg">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Digite o nome do atleta (Ex.: Daniel Baumann, Gabriel Silva...)"
              value={searchAthleteQuery}
              onChange={(e) => setSearchAthleteQuery(e.target.value)}
              className="w-full bg-[#08111B] border border-[#162D4A] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {!searchAthleteQuery.trim() ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Digite um nome no campo acima para pesquisar a linha do tempo do atleta.
            </div>
          ) : athleteMatches.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhuma partida encontrada para "{searchAthleteQuery}".
            </div>
          ) : (
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#00D2FF] block">
                {athleteMatches.length} partidas encontradas para o atleta pesquisado:
              </span>

              {/* Timeline Items */}
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#162D4A]">
                {athleteMatches.map((m: any) => {
                  const theme = getCategoryTheme(m.category?.name);
                  const time = m.scheduledTime
                    ? new Date(m.scheduledTime).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "A definir";

                  const conflicts = checkMatchTimeConflicts(
                    {
                      id: m.id,
                      pairA: m.pairA,
                      pairB: m.pairB,
                      scheduledTime: m.scheduledTime ? new Date(m.scheduledTime) : new Date(),
                    },
                    allMatches,
                    tournament.settings?.restBetweenMatchesMinutes || 30,
                    tournament.settings?.avgMatchDurationMinutes || 45
                  );

                  return (
                    <div key={m.id} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#00D2FF] ring-4 ring-[#0C1726]" />

                      <div className="p-4 rounded-xl bg-[#08111B] border border-[#162D4A] space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-[#00D2FF] text-sm">
                              {time}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold">
                              • {m.court?.name || "Quadra a definir"}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${theme.badge}`}>
                              {m.category.name}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              m.status === "LIVE"
                                ? "bg-cyan-500/20 text-[#00D2FF]"
                                : m.status === "FINISHED"
                                ? "bg-slate-800 text-slate-400"
                                : "bg-[#0C1726] text-slate-300"
                            }`}
                          >
                            {MatchStatusLabels[m.status] || m.status}
                          </span>
                        </div>

                        <div className="text-sm font-extrabold text-white">
                          {formatFullPairName(m.pairA)} <span className="text-slate-500 font-normal">vs.</span> {formatFullPairName(m.pairB)}
                        </div>

                        {/* Conflict Warning Badge if any */}
                        {conflicts.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>
                              <strong>Alerta de Intervalo:</strong> {conflicts[0].reason}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Remanejar Quadra / Horário (RF-013) */}
      {reassignMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0C1726] border border-[#162D4A] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setReassignMatch(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-1">
              Remanejar Confronto
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {formatPairName(reassignMatch.pairA)} vs {formatPairName(reassignMatch.pairB)} ({reassignMatch.category.name})
            </p>

            <form onSubmit={handleSaveReassign} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Atribuir Quadra
                </label>
                <select
                  value={targetCourtId}
                  onChange={(e) => setTargetCourtId(e.target.value)}
                  className="w-full bg-[#08111B] border border-[#162D4A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">A definir (Sem quadra)</option>
                  {courts.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type === "INDOOR_SAND" ? "Coberta" : "Externa"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Horário Previsto (HH:mm)
                </label>
                <input
                  type="time"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  className="w-full bg-[#08111B] border border-[#162D4A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#162D4A]">
                <button
                  type="button"
                  onClick={() => setReassignMatch(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingReassign}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#0099FF] hover:from-[#33DDFF] hover:to-[#1AA3FF] text-[#060B12] font-black"
                >
                  {savingReassign ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
