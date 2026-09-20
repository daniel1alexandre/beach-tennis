"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  PlusCircle,
  UploadCloud,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Award,
  Pencil,
} from "lucide-react";

export default function AthletesClient({
  tournamentId,
  categories,
  initialAthletes,
}: {
  tournamentId: string;
  categories: any[];
  initialAthletes: any[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pairs" | "athletes" | "import">("pairs");
  const [selectedCatId, setSelectedCatId] = useState<string>(
    categories[0]?.id || ""
  );

  const [athletesList, setAthletesList] = useState(initialAthletes);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showPairModal, setShowPairModal] = useState(false);
  const [showAthleteModal, setShowAthleteModal] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Pair Form
  const [pairForm, setPairForm] = useState({
    athlete1Id: "",
    athlete2Id: "",
    seedRanking: "",
  });

  // New Athlete Form
  const [athleteForm, setAthleteForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    gender: "MALE",
    club: "Arena Viva Beach Club",
  });

  // Batch import text
  const [batchText, setBatchText] = useState(
    "Carlos Dias, (11) 98888-1111, Amanda Silveira, (11) 98888-2222, Mista C, 1\nMarcos Antunes, (11) 98888-3333, Jessica Prado, (11) 98888-4444, Mista C, 2"
  );
  const [batchResult, setBatchResult] = useState<any>(null);

  const currentCategory = categories.find((c) => c.id === selectedCatId);

  // Handle Add Pair
  const handleAddPair = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/pairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCatId,
          athlete1Id: pairForm.athlete1Id,
          athlete2Id: pairForm.athlete2Id,
          seedRanking: pairForm.seedRanking || null,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setShowPairModal(false);
        setPairForm({ athlete1Id: "", athlete2Id: "", seedRanking: "" });
        setSuccessMessage(json.message);
        router.refresh();
      } else {
        setErrorMessage(json.error || "Erro ao inscrever dupla");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Erro de comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Athlete
  const handleAddAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/athletes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(athleteForm),
      });

      if (res.ok) {
        const created = await res.json();
        setAthletesList([...athletesList, created]);
        setShowAthleteModal(false);
        setAthleteForm({
          fullName: "",
          phone: "",
          email: "",
          gender: "MALE",
          club: "Arena Viva Beach Club",
        });
        setSuccessMessage("Atleta cadastrado no banco global com sucesso!");
        router.refresh();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Erro ao cadastrar atleta");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Athlete
  const handleSaveEditedAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAthlete) return;
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/athletes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAthlete),
      });

      if (res.ok) {
        const updated = await res.json();
        setAthletesList(
          athletesList.map((a) => (a.id === updated.id ? updated : a))
        );
        setEditingAthlete(null);
        setSuccessMessage(`Dados de ${updated.fullName} atualizados com sucesso!`);
        router.refresh();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Erro ao atualizar atleta");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Erro ao salvar edições do atleta.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Pair
  const handleDeletePair = async (pairId: string) => {
    if (!window.confirm("Remover esta dupla da categoria?")) return;
    try {
      const res = await fetch(`/api/pairs?id=${pairId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Batch Import
  const handleProcessBatch = async () => {
    setLoading(true);
    setBatchResult(null);

    try {
      const lines = batchText.trim().split("\n");
      const rows = lines.map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return {
          athlete1Name: parts[0] || "",
          athlete1Phone: parts[1] || "",
          athlete2Name: parts[2] || "",
          athlete2Phone: parts[3] || "",
          categoryName: parts[4] || "",
          seedRanking: parts[5] || null,
        };
      });

      const res = await fetch("/api/pairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch",
          tournamentId,
          rows,
        }),
      });

      const result = await res.json();
      setBatchResult(result);
      if (result.success) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAthletes = athletesList.filter(
    (a) =>
      a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.club && a.club.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Atletas & Inscrição de Duplas
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Gerencie o banco global de atletas, cabeças de chave e importação em lote
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAthleteModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#14231A] hover:bg-[#1C3325] border border-[#233F2E] text-emerald-400 font-bold text-xs transition"
          >
            + Novo Atleta
          </button>
          <button
            onClick={() => setShowPairModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition shadow-md shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Inscrever Dupla</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {successMessage}
          </span>
          <button onClick={() => setSuccessMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[#182C1F] pb-2">
        <button
          onClick={() => setActiveTab("pairs")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "pairs"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Duplas por Categoria
        </button>
        <button
          onClick={() => setActiveTab("athletes")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "athletes"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Banco Global de Atletas ({athletesList.length})
        </button>
        <button
          onClick={() => setActiveTab("import")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "import"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Importação em Lote (CSV / Texto)
        </button>
      </div>

      {/* TAB 1: DUPLAS POR CATEGORIA */}
      {activeTab === "pairs" && (
        <div className="space-y-6">
          {/* Category Selector Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCatId === cat.id
                    ? "bg-[#183022] text-emerald-300 border border-emerald-500/60 shadow-md"
                    : "bg-[#0F1C15] text-zinc-400 border border-[#192C20] hover:text-zinc-200"
                }`}
              >
                {cat.name} ({cat.pairs.length}/{cat.maxPairs})
              </button>
            ))}
          </div>

          {currentCategory && (
            <div className="p-6 rounded-2xl bg-[#0F1C15] border border-[#1A2E22] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#182C1F] pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Duplas Inscritas: {currentCategory.name}
                  </h3>
                  <span className="text-xs text-zinc-400">
                    Limite: {currentCategory.maxPairs} duplas • {currentCategory.pairs.filter((p: any) => p.status === 'CONFIRMED').length} Confirmadas • {currentCategory.pairs.filter((p: any) => p.status === 'WAITLIST').length} Lista de Espera
                  </span>
                </div>

                <button
                  onClick={() => setShowPairModal(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition"
                >
                  + Adicionar Dupla
                </button>
              </div>

              {currentCategory.pairs.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  Nenhuma dupla inscrita nesta categoria ainda.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentCategory.pairs.map((pair: any, index: number) => {
                    const isWaitlist = pair.status === "WAITLIST";
                    return (
                      <div
                        key={pair.id}
                        className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                          isWaitlist
                            ? "bg-[#14120E] border-amber-500/30"
                            : "bg-[#0A120E] border-[#182C1F]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-[#14231A] text-zinc-400 flex items-center justify-center font-mono text-xs font-bold">
                            #{index + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-white">
                                {pair.athlete1.fullName} & {pair.athlete2.fullName}
                              </span>
                              {pair.seedRanking && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                                  <Award className="w-3 h-3 text-amber-400" />
                                  Cabeça #{pair.seedRanking}
                                </span>
                              )}
                              {isWaitlist && (
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                                  Lista de Espera
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                              {pair.athlete1.club || "Arena"} • {pair.athlete2.club || "Arena"}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeletePair(pair.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 transition"
                          title="Remover dupla"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BANCO GLOBAL DE ATLETAS */}
      {activeTab === "athletes" && (
        <div className="p-6 rounded-2xl bg-[#0F1C15] border border-[#1A2E22] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar atleta por nome ou clube..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0A120E] border border-[#1A2E22] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={() => setShowAthleteModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition"
            >
              + Cadastrar Novo Atleta
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#0A120E] text-zinc-400 uppercase font-bold border-b border-[#182C1F]">
                <tr>
                  <th className="py-3 px-4">Nome Completo</th>
                  <th className="py-3 px-4">Telefone / WhatsApp</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4">Clube / Origem</th>
                  <th className="py-3 px-4">Gênero</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15241B]">
                {filteredAthletes.map((a) => (
                  <tr key={a.id} className="hover:bg-[#122217]/50">
                    <td className="py-3 px-4 font-bold text-white">{a.fullName}</td>
                    <td className="py-3 px-4 font-mono text-zinc-400">{a.phone}</td>
                    <td className="py-3 px-4 text-zinc-400">{a.email || "-"}</td>
                    <td className="py-3 px-4 text-zinc-300">{a.club || "-"}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {a.gender === "MALE" ? "Masc" : a.gender === "FEMALE" ? "Fem" : "Outro"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setEditingAthlete({ ...a })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14231A] hover:bg-[#1E3628] border border-[#233C2D] text-emerald-300 text-xs font-semibold transition"
                        title="Editar Informações do Atleta"
                      >
                        <Pencil className="w-3 h-3 text-emerald-400" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: IMPORTAÇÃO EM LOTE */}
      {activeTab === "import" && (
        <div className="p-6 rounded-2xl bg-[#0F1C15] border border-[#1A2E22] space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Importação em Lote via Colagem de Texto ou CSV (RF-007)
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Cole linhas no formato:{" "}
              <code className="text-emerald-300 bg-black/40 px-1.5 py-0.5 rounded">
                Atleta 1, Telefone 1, Atleta 2, Telefone 2, Nome da Categoria, Cabeça de Chave
              </code>
            </p>
          </div>

          <textarea
            rows={8}
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              O sistema criará atletas inexistentes automaticamente no banco global.
            </span>
            <button
              onClick={handleProcessBatch}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-400 text-black font-extrabold text-xs transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Processando..." : "Importar Duplas em Lote"}
            </button>
          </div>

          {batchResult && (
            <div className="p-4 rounded-xl bg-[#0A120E] border border-[#182C1F] text-xs space-y-2">
              <div className="text-emerald-400 font-bold">
                ✓ {batchResult.createdCount} duplas importadas com sucesso!
              </div>
              {batchResult.errors?.length > 0 && (
                <div className="text-amber-400 space-y-1">
                  <span className="font-bold">Avisos / Linhas ignoradas:</span>
                  <ul className="list-disc list-inside text-zinc-400 text-[11px]">
                    {batchResult.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Inscrever Dupla */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101C16] border border-[#1E3628] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowPairModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-1">
              Inscrever Dupla na Categoria
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Selecione 2 atletas do banco global para a categoria{" "}
              <strong className="text-emerald-400">{currentCategory?.name}</strong>
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddPair} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Atleta 1 *
                </label>
                <select
                  required
                  value={pairForm.athlete1Id}
                  onChange={(e) =>
                    setPairForm({ ...pairForm, athlete1Id: e.target.value })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                >
                  <option value="">Selecione o Atleta 1...</option>
                  {athletesList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName} ({a.club || "Sem clube"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Atleta 2 *
                </label>
                <select
                  required
                  value={pairForm.athlete2Id}
                  onChange={(e) =>
                    setPairForm({ ...pairForm, athlete2Id: e.target.value })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                >
                  <option value="">Selecione o Atleta 2...</option>
                  {athletesList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName} ({a.club || "Sem clube"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Cabeça de Chave (Seed Ranking) - Opcional
                </label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  placeholder="Ex.: 1, 2, 3... ou deixe vazio para não ranqueado"
                  value={pairForm.seedRanking}
                  onChange={(e) =>
                    setPairForm({ ...pairForm, seedRanking: e.target.value })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#1C3225]">
                <button
                  type="button"
                  onClick={() => setShowPairModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold disabled:opacity-50"
                >
                  {loading ? "Confirmando..." : "Confirmar Inscrição"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Atleta */}
      {showAthleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101C16] border border-[#1E3628] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowAthleteModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-1">
              Cadastrar Novo Atleta
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Adiciona o atleta ao banco global reutilizável
            </p>

            <form onSubmit={handleAddAthlete} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={athleteForm.fullName}
                  onChange={(e) =>
                    setAthleteForm({ ...athleteForm, fullName: e.target.value })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="(11) 98765-4321"
                  value={athleteForm.phone}
                  onChange={(e) =>
                    setAthleteForm({ ...athleteForm, phone: e.target.value })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={athleteForm.email}
                  onChange={(e) =>
                    setAthleteForm({ ...athleteForm, email: e.target.value })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Clube / Academia / Arena
                </label>
                <input
                  type="text"
                  value={athleteForm.club}
                  onChange={(e) =>
                    setAthleteForm({ ...athleteForm, club: e.target.value })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Gênero
                </label>
                <select
                  value={athleteForm.gender}
                  onChange={(e) =>
                    setAthleteForm({ ...athleteForm, gender: e.target.value })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                >
                  <option value="MALE">Masculino</option>
                  <option value="FEMALE">Feminino</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#1C3225]">
                <button
                  type="button"
                  onClick={() => setShowAthleteModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold"
                >
                  {loading ? "Salvando..." : "Salvar Atleta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Atleta */}
      {editingAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101C16] border border-[#1E3628] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setEditingAthlete(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-1 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-emerald-400" />
              Editar Informações do Atleta
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Atualize os dados cadastrais do atleta no banco global
            </p>

            <form onSubmit={handleSaveEditedAthlete} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={editingAthlete.fullName || ""}
                  onChange={(e) =>
                    setEditingAthlete({
                      ...editingAthlete,
                      fullName: e.target.value,
                    })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={editingAthlete.phone || ""}
                  onChange={(e) =>
                    setEditingAthlete({
                      ...editingAthlete,
                      phone: e.target.value,
                    })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={editingAthlete.email || ""}
                  onChange={(e) =>
                    setEditingAthlete({
                      ...editingAthlete,
                      email: e.target.value,
                    })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Clube / Academia / Arena
                </label>
                <input
                  type="text"
                  value={editingAthlete.club || ""}
                  onChange={(e) =>
                    setEditingAthlete({
                      ...editingAthlete,
                      club: e.target.value,
                    })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Gênero
                </label>
                <select
                  value={editingAthlete.gender || "MALE"}
                  onChange={(e) =>
                    setEditingAthlete({
                      ...editingAthlete,
                      gender: e.target.value,
                    })
                  }
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white"
                >
                  <option value="MALE">Masculino</option>
                  <option value="FEMALE">Feminino</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#1C3225]">
                <button
                  type="button"
                  onClick={() => setEditingAthlete(null)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold"
                >
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
