"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, X, Trophy, MapPin, Calendar, UserCheck } from "lucide-react";

export default function CreateTournamentModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    location: "Arena Viva Beach Club",
    startDate: new Date().toISOString().split("T")[0] + "T08:00",
    endDate: new Date(Date.now() + 86400000).toISOString().split("T")[0] + "T20:00",
    organizer: "Daniel Baumann / Viva By Baumann",
    notes: "Regulamento oficial CBT / ITF. Fase de grupos 1 set até 6 games. Mata-mata em Pro Set.",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const created = await res.json();
        setIsOpen(false);
        router.push(`/torneios/${created.id}`);
        router.refresh();
      } else {
        alert("Erro ao criar torneio.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm transition shadow-lg shadow-cyan-500/25 active:scale-95"
      >
        <PlusCircle className="w-4 h-4 stroke-[2.5]" />
        <span>Novo Torneio</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0C1726] border border-[#1E3A5F] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Criar Novo Torneio</h3>
                <p className="text-xs text-zinc-400">Cadastre os dados iniciais para gerenciar categorias e quadras</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome do Torneio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: 2º Open Viva Beach Tennis 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Local / Arena
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Início do Torneio
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Término Previsto
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Organizador Responsável
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Avisos / Regulamento Resumido
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#0A120E] border border-[#1E3628] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1C3225]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold hover:bg-zinc-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition disabled:opacity-50"
                >
                  {loading ? "Criando..." : "Criar Torneio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
