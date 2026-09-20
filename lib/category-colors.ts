export interface CategoryTheme {
  name: string;
  badge: string;
  border: string;
  bg: string;
  text: string;
  indicator: string;
  hex: string;
}

export const CATEGORY_PALETTE: CategoryTheme[] = [
  {
    name: "Cyan Neon",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
    border: "border-cyan-500/40",
    bg: "bg-cyan-950/25",
    text: "text-cyan-400",
    indicator: "bg-cyan-400",
    hex: "#00D2FF",
  },
  {
    name: "Fuchsia / Rosa Neon",
    badge: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40",
    border: "border-fuchsia-500/40",
    bg: "bg-fuchsia-950/25",
    text: "text-fuchsia-400",
    indicator: "bg-fuchsia-400",
    hex: "#E879F9",
  },
  {
    name: "Âmbar / Amarelo Ouro",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    border: "border-amber-500/40",
    bg: "bg-amber-950/25",
    text: "text-amber-400",
    indicator: "bg-amber-400",
    hex: "#F59E0B",
  },
  {
    name: "Violeta / Roxo Neon",
    badge: "bg-violet-500/15 text-violet-300 border-violet-500/40",
    border: "border-violet-500/40",
    bg: "bg-violet-950/25",
    text: "text-violet-400",
    indicator: "bg-violet-400",
    hex: "#A855F7",
  },
  {
    name: "Esmeralda Neon",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    border: "border-emerald-500/40",
    bg: "bg-emerald-950/25",
    text: "text-emerald-400",
    indicator: "bg-emerald-400",
    hex: "#10B981",
  },
  {
    name: "Coral / Laranja Neon",
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    border: "border-orange-500/40",
    bg: "bg-orange-950/25",
    text: "text-orange-400",
    indicator: "bg-orange-400",
    hex: "#F97316",
  },
  {
    name: "Rose / Vermelho Neon",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    border: "border-rose-500/40",
    bg: "bg-rose-950/25",
    text: "text-rose-400",
    indicator: "bg-rose-400",
    hex: "#F43F5E",
  },
  {
    name: "Verde Limão Neon",
    badge: "bg-lime-500/15 text-lime-300 border-lime-500/40",
    border: "border-lime-500/40",
    bg: "bg-lime-950/25",
    text: "text-lime-400",
    indicator: "bg-lime-400",
    hex: "#84CC16",
  },
  {
    name: "Azul Céu Elétrico",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/40",
    border: "border-sky-500/40",
    bg: "bg-sky-950/25",
    text: "text-sky-400",
    indicator: "bg-sky-400",
    hex: "#0EA5E9",
  },
];

export function getCategoryTheme(
  categoryNameOrId: string = "",
  indexFallback: number = 0,
  explicitColor?: string | null
): CategoryTheme {
  // Se houver cor explícita cadastrada na categoria, prioriza ela
  if (explicitColor) {
    const found = CATEGORY_PALETTE.find(
      (p) => p.hex.toLowerCase() === explicitColor.toLowerCase()
    );
    if (found) return found;

    // Se for um hex customizado que não está na lista padrão
    return {
      name: "Custom",
      badge: "border text-white",
      border: "border-cyan-500/40",
      bg: "bg-slate-900/50",
      text: "text-cyan-300",
      indicator: "bg-cyan-400",
      hex: explicitColor,
    };
  }

  const normalized = categoryNameOrId.toLowerCase();
  
  if (normalized.includes("open") || normalized.includes("masc")) {
    return CATEGORY_PALETTE[0]; // Cyan Neon
  }
  if (normalized.includes("fem")) {
    return CATEGORY_PALETTE[1]; // Fuchsia Neon
  }
  if (normalized.includes("mista")) {
    return CATEGORY_PALETTE[2]; // Amber Neon
  }
  if (normalized.includes("iniciante") || normalized.includes("d") || normalized.includes("4")) {
    return CATEGORY_PALETTE[3]; // Violet Neon
  }
  if (normalized.includes("pro") || normalized.includes("a")) {
    return CATEGORY_PALETTE[4]; // Emerald Neon
  }

  // Fallback hash
  let hash = 0;
  for (let i = 0; i < categoryNameOrId.length; i++) {
    hash = categoryNameOrId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % CATEGORY_PALETTE.length;
  return CATEGORY_PALETTE[idx] || CATEGORY_PALETTE[indexFallback % CATEGORY_PALETTE.length];
}
