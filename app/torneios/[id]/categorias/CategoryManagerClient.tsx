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
  Pencil,
} from "lucide-react";
import {
  CategoryTypeLabels,
  CategoryFormatLabels,
  MatchRuleLabels,
} from "@/lib/enums";
import { getCategoryTheme } from "@/lib/category-colors";

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
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [loading, setLoading] = useState(false);

  // Form data for creating
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

  // Handle Create Category
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
        setFormData({
          name: "",
          type: "DUPLA_MASC",
          maxPairs: 8,
          format: "GROUPS_AND_KNOCKOUT",
          groupCount: 2,
          advancePerGroup: 2,
          bracketSize: 4,
          matchRule: "ONE_STANDARD_SET_6",
        });
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

  // Handle Edit Category
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name) return;

    setLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCategory),
      });

      if (res.ok) {
        const updated = await res.json();
        setCategories(categories.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
        setEditingCategory(null);
        router.refresh();
      } else {
        alert("Erro ao atualizar categoria");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Category
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
            <Layers className="w-6 h-6 text-[#00D2FF]" />
            Gestão de Categorias
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Defina os tipos de gênero, número de grupos, regras CBT de avanço e pontuação por categoria
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#0099FF] hover:from-[#33DDFF] hover:to-[#1AA3FF] text-[#060B12] font-black text-sm transition shadow-lg shadow-cyan-500/20 active:scale-95"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Categories Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {categories.map((cat, idx) => {
          const theme = getCategoryTheme(cat.name, idx);

          return (
            <div
              key={cat.id}
              className={`p-6 rounded-2xl bg-[#0C1726] border ${theme.border} hover:border-cyan-400/50 transition-all shadow-md flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{cat.name}</h3>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${theme.badge}`}>
                      {CategoryTypeLabels[cat.type] || cat.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Botão de Editar Categoria */}
                    <button
                      onClick={() => setEditingCategory({ ...cat })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#00D2FF] hover:bg-cyan-500/10 transition"
                      title="Editar Categoria"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 my-2 border-y border-[#162D4A] text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Formato:</span>
                    <span className="font-bold text-slate-200">
                      {CategoryFormatLabels[cat.format] || cat.format}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Regra de Pontuação:</span>
                    <span className="font-bold text-slate-200">
                      {MatchRuleLabels[cat.matchRule] || cat.matchRule}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Grupos / Avanço CBT:</span>
                    <span className="font-bold text-[#00D2FF]">
                      {cat.groupCount} grupos • avança top {cat.advancePerGroup}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Capacidade / Limite:</span>
                    <span className="font-bold text-slate-200">
                      {cat._count.pairs} / {cat.maxPairs} duplas inscritas
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#00D2FF]" />
                  {cat._count.pairs} duplas confirmadas
                </span>
                <span>{cat._count.matches} confrontos gerados</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: NOVA CATEGORIA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0C1726] border border-[#162D4A] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-1">
              Cadastrar Nova Categoria
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Configure as regras de grupo, mata-mata e limite de inscritos
            </p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: Dupla Masculina Pro, Feminina Open, Mista B..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#08111B] border border-[#162D4A] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Gênero / Divisão
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-[#08111B] border border-[#162D4A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="DUPLA_MASC">Dupla Masculina</option>
                    <option value="DUPLA_FEM">Dupla Feminina</option>
                    <option value="DUPLA_MISTA">Dupla Mista</option>
                    <option value="SIMPLES_MASC">Simples Masculina</option>
                    <option value="SIMPLES_FEM">Simples Feminina</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Limite Máximo de Duplas
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={64}
                    value={formData.maxPairs}
                    onChange={(e) =>
                      setFormData({ ...formData, maxPairs: parseInt(e.target.value) || 8 })
                    }
                    className="w-full bg-[#08111B] border border-[#162D4A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Quantidade de Grupos
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={formData.groupCount}
                    onChange={(e) =>
                      setFormData({ ...formData, groupCount: parseInt(e.target.value) || 2 })
                    }
                    className="w-full bg-[#08111B] border border-[#162D4A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Classificados por Grupo (CBT)
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
                    className="w-full bg-[#08111B] border border-[#162D4A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#162D4A]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#0099FF] hover:from-[#33DDFF] hover:to-[#1AA3FF] text-[#060B12] font-black"
                >
                  {loading ? "Salvando..." : "Criar Categoria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR CATEGORIA */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0C1726] border border-[#162D4A] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setEditingCategory(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-1">
              Editar Categoria
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Atualize as configurações e parâmetros de disputa da categoria
            </p>

            <form onSubmit={handleEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                  className="w-full bg-[#08111B] border border-[#162D4A] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Gênero / Divisão
                  </label>
                  <select
                    value={editingCategory.type}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, type: e.target.value })
                    }
                    className="w-full bg-[#08111B] border border-[#162D4A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="DUPLA_MASC">Dupla Masculina</option>
                    <option value="DUPLA_FEM">Dupla Feminina</option>
                    <option value="DUPLA_MISTA">Dupla Mista</option>
                    <option value="SIMPLES_MASC">Simples Masculina</option>
                    <option value="SIMPLES_FEM">Simples Feminina</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Limite Máximo de Duplas
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={64}
                    value={editingCategory.maxPairs}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        maxPairs: parseInt(e.target.value) || 8,
                      })
                    }
                    className="w-full bg-[#08111B] border border-[#162D4A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Quantidade de Grupos
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={editingCategory.groupCount}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        groupCount: parseInt(e.target.value) || 2,
                      })
                    }
                    className="w-full bg-[#08111B] border border-[#162D4A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Classificados por Grupo (CBT)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={editingCategory.advancePerGroup}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        advancePerGroup: parseInt(e.target.value) || 2,
                      })
                    }
                    className="w-full bg-[#08111B] border border-[#162D4A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#162D4A]">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00D2FF] to-[#0099FF] hover:from-[#33DDFF] hover:to-[#1AA3FF] text-[#060B12] font-black"
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
