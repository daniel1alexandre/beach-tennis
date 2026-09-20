"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("bt-theme") as "dark" | "light" | null;
    if (stored) {
      setTheme(stored);
      applyTheme(stored);
    } else {
      // Default to dark
      applyTheme("dark");
    }
  }, []);

  const applyTheme = (t: "dark" | "light") => {
    const root = document.documentElement;
    if (t === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
    localStorage.setItem("bt-theme", t);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-xl bg-slate-800/40 border border-[#162D4A]" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${
        isDark
          ? "bg-[#0C1726] border-[#162D4A] text-amber-300 hover:text-amber-200 hover:border-amber-400/40"
          : "bg-white border-slate-300 text-amber-500 hover:text-amber-600 hover:border-amber-400"
      }`}
      title={isDark ? "Mudar para Modo Dia (Claro)" : "Mudar para Modo Noite (Escuro)"}
      aria-label="Alternar modo dia e noite"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
          <span className="hidden sm:inline text-[11px] text-slate-300">Modo Dia</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-cyan-600 animate-in spin-in-180 duration-300" />
          <span className="hidden sm:inline text-[11px] text-slate-700">Modo Noite</span>
        </>
      )}
    </button>
  );
}
