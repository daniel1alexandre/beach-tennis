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
    name: "Fuchsia Neon",
    badge: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40",
    border: "border-fuchsia-500/40",
    bg: "bg-fuchsia-950/25",
    text: "text-fuchsia-400",
    indicator: "bg-fuchsia-400",
    hex: "#E879F9",
  },
  {
    name: "Amber Neon",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    border: "border-amber-500/40",
    bg: "bg-amber-950/25",
    text: "text-amber-400",
    indicator: "bg-amber-400",
    hex: "#F59E0B",
  },
  {
    name: "Violet Neon",
    badge: "bg-violet-500/15 text-violet-300 border-violet-500/40",
    border: "border-violet-500/40",
    bg: "bg-violet-950/25",
    text: "text-violet-400",
    indicator: "bg-violet-400",
    hex: "#A855F7",
  },
  {
    name: "Emerald Neon",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    border: "border-emerald-500/40",
    bg: "bg-emerald-950/25",
    text: "text-emerald-400",
    indicator: "bg-emerald-400",
    hex: "#10B981",
  },
  {
    name: "Coral Neon",
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/40",
    border: "border-orange-500/40",
    bg: "bg-orange-950/25",
    text: "text-orange-400",
    indicator: "bg-orange-400",
    hex: "#F97316",
  },
];

export function getCategoryTheme(categoryNameOrId: string = "", indexFallback: number = 0): CategoryTheme {
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
