"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  PlusCircle,
  Trash2,
  Users,
  Settings2,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  CategoryTypeLabels,
  CategoryFormatLabels,
  MatchRuleLabels,
} from "@/lib/enums";

interface CategoryItem {
  id: string;
  name: string;
  type: string;
  maxPairs: number;
  format: string;
  groupCount: number;
  advancePerGroup: number;
  bracketSize: number;
  matchRule: string;
  _count: { pairs: number; matches: number };
}

export default function CategoryManagerClient({
  tournamentId,
  initialCategories,
}: {
  tournamentId: string;
  initialCategories: CategoryItem[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "DUPLA_MASC",
    maxPairs: 8,
    format: "GROUPS_AND_KNOCKOUT",
    groupCount: 2,
    advancePerGroup: 2,
    bracketSize: 4,
    matchRule: "ONE_STANDARD_SET_6",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, tournamentId }),
      });

      if (res.ok) {
        setShowModal(false);
        router.refresh();
      } else {
        alert("Erro ao criar categoria");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir a categoria "${name}"? Todas as duplas e jogos vinculados serão removidos.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCategories(categories.filter((c) => c.id !== id));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-400" />
            Gestão de Categorias
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Defina os tipos de gênero, número de grupos, regras de avanço e pontuação por categoria
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm transition shadow-lg shadow-emerald-500/20"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Categories Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-6 rounded-2xl bg-[#0F1C15] border border-[#1A2E22] hover:border-emerald-500/40 transition-all shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{cat.name}</h3>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {CategoryTypeLabels[cat.type] || cat.type}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  title="Excluir Categoria"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs py-3 px-3.5 rounded-xl bg-[#09110D] border border-[#172A1E] mb-4">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase block font-medium">Formato</span>
                  <span className="font-semibold text-zinc-200">
                    {CategoryFormatLabels[cat.format] || cat.format}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase block font-medium">Regra de Jogo</span>
                  <span className="font-semibold text-zinc-200">
                    {MatchRuleLabels[cat.matchRule] || cat.matchRule}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase block font-medium">Grupos & Classificação</span>
                  <span className="font-semibold text-zinc-200">
                    {cat.groupCount} grupos • avança top {cat.advancePerGroup}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase block font-medium">Tamanho da Chave</span>
                  <span className="font-semibold text-emerald-400">
                    Mata-Mata ({cat.bracketSize} posições)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#18291F] flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-500" />
                Inscritos: <strong className="text-white">{cat._count.pairs} / {cat.maxPairs} duplas</strong>
              </span>
              <span className="font-mono text-zinc-400">
                {cat._count.matches} confrontos gerados
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nova Categoria */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#101C16] border border-[#1E3628] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Criar Nova Categoria</h3>
                <p className="text-xs text-zinc-400">Configure as regras de disputa e chaves</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Masc Open, Fem C, Mista B, Masters 40+"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Tipo / Gênero
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="DUPLA_MASC">Dupla Masculina</option>
                    <option value="DUPLA_FEM">Dupla Feminina</option>
                    <option value="DUPLA_MISTA">Dupla Mista</option>
                    <option value="SIMPLES">Simples</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Limite Máx. de Duplas
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={64}
                    value={formData.maxPairs}
                    onChange={(e) =>
                      setFormData({ ...formData, maxPairs: parseInt(e.target.value) || 8 })
                    }
                    className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Formato da Disputa
                  </label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="GROUPS_AND_KNOCKOUT">Grupos + Mata-Mata</option>
                    <option value="KNOCKOUT_ONLY">Mata-Mata Direto</option>
                    <option value="ROUND_ROBIN_ONLY">Pontos Corridos</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Regra de Pontuação (Set)
                  </label>
                  <select
                    value={formData.matchRule}
                    onChange={(e) => setFormData({ ...formData, matchRule: e.target.value })}
                    className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ONE_STANDARD_SET_6">1 Set até 6 games</option>
                    <option value="ONE_PRO_SET_9">1 Pro Set até 9 games</option>
                    <option value="BEST_OF_3_SETS">Melhor de 3 Sets</option>
                    <option value="SUPER_TIEBREAK_10">Super Tiebreak até 10</option>
                  </select>
                </div>
              </div>

              {formData.format === "GROUPS_AND_KNOCKOUT" && (
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-[#09110D] border border-[#1A2E22]">
                  <div>
                    <label className="block font-medium text-zinc-400 mb-1 text-[11px]">
                      Qtd. Grupos
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={formData.groupCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          groupCount: parseInt(e.target.value) || 2,
                        })
                      }
                      className="w-full bg-[#121E17] border border-[#1E3628] rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-400 mb-1 text-[11px]">
                      Avançam/Grupo
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={formData.advancePerGroup}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          advancePerGroup: parseInt(e.target.value) || 2,
                        })
                      }
                      className="w-full bg-[#121E17] border border-[#1E3628] rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-zinc-400 mb-1 text-[11px]">
                      Chave Mata-Mata
                    </label>
                    <select
                      value={formData.bracketSize}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bracketSize: parseInt(e.target.value) || 4,
                        })
                      }
                      className="w-full bg-[#121E17] border border-[#1E3628] rounded-lg px-2.5 py-1.5 text-white"
                    >
                      <option value={4}>4 duplas (Semi)</option>
                      <option value={8}>8 duplas (Quartas)</option>
                      <option value={16}>16 duplas (Oitavas)</option>
                      <option value={32}>32 duplas</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1C3225]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white font-semibold hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Criar Categoria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
