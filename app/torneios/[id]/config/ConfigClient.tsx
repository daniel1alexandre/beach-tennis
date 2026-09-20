"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Flame,
  Clock,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  Sliders,
  Pencil,
  X,
} from "lucide-react";
import { CourtTypeLabels, CourtStatusLabels } from "@/lib/enums";

export default function ConfigClient({ tournament }: { tournament: any }) {
  const router = useRouter();
  const settings = tournament.settings || {};

  const [durations, setDurations] = useState({
    avgMatchDurationMinutes: settings.avgMatchDurationMinutes || 45,
    warmupDurationMinutes: settings.warmupDurationMinutes || 5,
    intervalBetweenMatchesMinutes: settings.intervalBetweenMatchesMinutes || 5,
    restBetweenMatchesMinutes: settings.restBetweenMatchesMinutes || 30,
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Court Form
  const [showAddCourt, setShowAddCourt] = useState(false);
  const [newCourtName, setNewCourtName] = useState("");
  const [newCourtType, setNewCourtType] = useState("SAND");
  const [addingCourt, setAddingCourt] = useState(false);

  // Edit Court Modal
  const [editingCourt, setEditingCourt] = useState<any | null>(null);
  const [savingCourtEdit, setSavingCourtEdit] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: tournament.id,
          ...durations,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Configurações salvas com sucesso!");
        setTimeout(() => setSuccessMsg(null), 3000);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourtName) return;

    setAddingCourt(true);
    try {
      const res = await fetch("/api/courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: tournament.id,
          name: newCourtName,
          type: newCourtType,
          status: "AVAILABLE",
          displayOrder: tournament.courts.length + 1,
        }),
      });

      if (res.ok) {
        setNewCourtName("");
        setShowAddCourt(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingCourt(false);
    }
  };

  const handleToggleCourtStatus = async (courtId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "MAINTENANCE" ? "AVAILABLE" : "MAINTENANCE";
    try {
      const res = await fetch("/api/courts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId,
          status: nextStatus,
        }),
      });
      if (res.ok) router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourt = async (courtId: string, name: string) => {
    if (!window.confirm(`Excluir a "${name}"?`)) return;
    try {
      const res = await fetch(`/api/courts?id=${courtId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEditedCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourt) return;
    setSavingCourtEdit(true);

    try {
      const res = await fetch("/api/courts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: editingCourt.id,
          name: editingCourt.name,
          type: editingCourt.type,
          status: editingCourt.status,
          displayOrder: editingCourt.displayOrder,
        }),
      });

      if (res.ok) {
        setEditingCourt(null);
        setSuccessMsg("Informações da quadra atualizadas com sucesso!");
        setTimeout(() => setSuccessMsg(null), 3000);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCourtEdit(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" />
          Configurações Operacionais & Quadras
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Gerencie os parâmetros temporais, tempo de descanso entre partidas e quadras da arena
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. QUADRAS DA ARENA (RF-019) */}
        <div className="p-6 rounded-2xl bg-[#0F1C15] border border-[#1A2E22] space-y-5">
          <div className="flex items-center justify-between border-b border-[#182C1F] pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-emerald-400" />
                Quadras da Arena ({tournament.courts.length})
              </h3>
              <p className="text-xs text-zinc-400">
                Pausar para manutenção ou alterar ordem de exibição no telão
              </p>
            </div>

            <button
              onClick={() => setShowAddCourt(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nova Quadra</span>
            </button>
          </div>

          {/* Add Court Inline Modal */}
          {showAddCourt && (
            <form
              onSubmit={handleAddCourt}
              className="p-4 rounded-xl bg-[#0A120E] border border-[#1E3628] space-y-3 text-xs"
            >
              <div className="font-bold text-white">Cadastrar Nova Quadra</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nome (Ex.: Quadra 5)"
                  value={newCourtName}
                  onChange={(e) => setNewCourtName(e.target.value)}
                  className="bg-[#121E17] border border-[#1E3628] rounded-lg px-3 py-2 text-white"
                />
                <select
                  value={newCourtType}
                  onChange={(e) => setNewCourtType(e.target.value)}
                  className="bg-[#121E17] border border-[#1E3628] rounded-lg px-3 py-2 text-white"
                >
                  <option value="SAND">Areia Externa</option>
                  <option value="INDOOR_SAND">Areia Coberta</option>
                  <option value="QUICK">Piso Rápido</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourt(false)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingCourt}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold"
                >
                  {addingCourt ? "Adicionando..." : "Salvar Quadra"}
                </button>
              </div>
            </form>
          )}

          {/* Courts List */}
          <div className="space-y-2.5">
            {tournament.courts.map((court: any) => {
              const isMaintenance = court.status === "MAINTENANCE";
              return (
                <div
                  key={court.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isMaintenance
                      ? "bg-[#14100D] border-amber-500/30"
                      : "bg-[#0A120E] border-[#182C1F]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#14231A] text-zinc-400 flex items-center justify-center font-mono text-xs font-bold">
                      #{court.displayOrder}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white">
                          {court.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            isMaintenance
                              ? "bg-amber-500/20 text-amber-400"
                              : court.status === "OCCUPIED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {CourtStatusLabels[court.status] || court.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        {CourtTypeLabels[court.type] || court.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingCourt({ ...court })}
                      className="p-1.5 rounded-lg bg-[#14231A] hover:bg-[#1E3628] border border-[#233C2D] text-emerald-300 text-xs font-semibold transition flex items-center gap-1"
                      title="Editar Informações da Quadra"
                    >
                      <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>

                    <button
                      onClick={() => handleToggleCourtStatus(court.id, court.status)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        isMaintenance
                          ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                          : "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                      }`}
                      title={isMaintenance ? "Liberar Quadra" : "Pausar para Manutenção"}
                    >
                      {isMaintenance ? (
                        <PlayCircle className="w-4 h-4" />
                      ) : (
                        <PauseCircle className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">
                        {isMaintenance ? "Liberar" : "Manutenção"}
                      </span>
                    </button>

                    <button
                      onClick={() => handleDeleteCourt(court.id, court.name)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition"
                      title="Excluir Quadra"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. PARÂMETROS TEMPORAIS (RF-020) */}
        <div className="p-6 rounded-2xl bg-[#0F1C15] border border-[#1A2E22] space-y-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#182C1F] pb-4 mb-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                Parâmetros Temporais & Regras de Descanso (RF-020)
              </h3>
              <p className="text-xs text-zinc-400">
                Alocação automática e validação de conflitos de atletas (RN-002)
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Duração Média Estimada por Partida (minutos)
                </label>
                <input
                  type="number"
                  min={15}
                  max={180}
                  value={durations.avgMatchDurationMinutes}
                  onChange={(e) =>
                    setDurations({
                      ...durations,
                      avgMatchDurationMinutes: parseInt(e.target.value) || 45,
                    })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2.5 text-white font-mono"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Usado no cálculo de grade e previsão de horários das fases seguintes.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Tempo Mínimo de Descanso entre Jogos Consecutivos (minutos)
                </label>
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={durations.restBetweenMatchesMinutes}
                  onChange={(e) =>
                    setDurations({
                      ...durations,
                      restBetweenMatchesMinutes: parseInt(e.target.value) || 30,
                    })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2.5 text-white font-mono text-emerald-400 font-bold"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Regra RN-002: Alertas visuais e bloqueio caso um atleta seja escalado com descanso inferior.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Aquecimento (min)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={durations.warmupDurationMinutes}
                    onChange={(e) =>
                      setDurations({
                        ...durations,
                        warmupDurationMinutes: parseInt(e.target.value) || 5,
                      })
                    }
                    className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Transição de Quadra (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={durations.intervalBetweenMatchesMinutes}
                    onChange={(e) =>
                      setDurations({
                        ...durations,
                        intervalBetweenMatchesMinutes: parseInt(e.target.value) || 5,
                      })
                    }
                    className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#182C1F] flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {savingSettings ? "Salvando..." : "Salvar Parâmetros"}
                </button>
              </div>
            </form>
          </div>

          <div className="p-4 rounded-xl bg-[#0A120E] border border-[#182C1F] text-[11px] text-zinc-400 mt-4">
            ⚡ <strong>Resiliência Operacional (RNF-003):</strong> Todas as alterações de tempo e estado das quadras possuem persistência atômica no banco de dados SQLite.
          </div>
        </div>
      </div>

      {/* Modal: Editar Quadra */}
      {editingCourt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101C16] border border-[#1E3628] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setEditingCourt(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-1 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-emerald-400" />
              Editar Informações da Quadra
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Atualize a identificação, tipo de piso, status e ordem no telão
            </p>

            <form onSubmit={handleSaveEditedCourt} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Nome da Quadra *
                </label>
                <input
                  type="text"
                  required
                  value={editingCourt.name || ""}
                  onChange={(e) =>
                    setEditingCourt({ ...editingCourt, name: e.target.value })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Tipo de Piso
                  </label>
                  <select
                    value={editingCourt.type || "SAND"}
                    onChange={(e) =>
                      setEditingCourt({ ...editingCourt, type: e.target.value })
                    }
                    className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="SAND">Areia Externa</option>
                    <option value="INDOOR_SAND">Areia Coberta</option>
                    <option value="QUICK">Piso Rápido</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Ordem no Telão
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={editingCourt.displayOrder || 1}
                    onChange={(e) =>
                      setEditingCourt({
                        ...editingCourt,
                        displayOrder: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Status Operacional
                </label>
                <select
                  value={editingCourt.status || "AVAILABLE"}
                  onChange={(e) =>
                    setEditingCourt({ ...editingCourt, status: e.target.value })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                >
                  <option value="AVAILABLE">Disponível (Pronta para jogo)</option>
                  <option value="OCCUPIED">Em Jogo (Ocupada)</option>
                  <option value="MAINTENANCE">Manutenção (Pausada)</option>
                  <option value="INACTIVE">Inativa</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#1C3225]">
                <button
                  type="button"
                  onClick={() => setEditingCourt(null)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCourtEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold"
                >
                  {savingCourtEdit ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
