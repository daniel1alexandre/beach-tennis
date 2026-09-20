export interface GroupStanding {
  pairId: string;
  pairName: string;
  athlete1Name: string;
  athlete2Name: string;
  seed?: number | null;
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  gamesWon: number;
  gamesLost: number;
  gamesDiff: number;
  qualified: boolean;
  position: number;
}

export interface SetDetail {
  set: number;
  gamesA: number;
  gamesB: number;
  tiebreakA?: number | null;
  tiebreakB?: number | null;
}

export function parseSetsDetail(raw: string | null | undefined): SetDetail[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function formatPairName(p?: {
  athlete1?: { fullName: string };
  athlete2?: { fullName: string };
} | null): string {
  if (!p || !p.athlete1) return "A definir";
  const a1 = p.athlete1.fullName.split(" ")[0] || "";
  const a2 = p.athlete2?.fullName ? p.athlete2.fullName.split(" ")[0] : "";
  return a2 ? `${a1} / ${a2}` : a1;
}

export function formatFullPairName(p?: {
  athlete1?: { fullName: string };
  athlete2?: { fullName: string };
} | null): string {
  if (!p || !p.athlete1) return "A definir";
  return p.athlete2?.fullName
    ? `${p.athlete1.fullName} & ${p.athlete2.fullName}`
    : p.athlete1.fullName;
}
