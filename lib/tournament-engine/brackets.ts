export interface QualifiedTeam {
  pairId: string;
  groupName: string;
  positionInGroup: number; // 1 or 2
  seedRanking?: number | null;
}

export type BracketPhase =
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTERFINALS"
  | "SEMIFINALS"
  | "FINAL";

export interface BracketMatchDraft {
  tempId: string;
  phase: BracketPhase;
  round: number;
  positionInBracket: number;
  pairAId?: string | null;
  pairBId?: string | null;
  nextMatchTempId?: string | null;
  nextMatchSlot?: "PAIR_A" | "PAIR_B" | null;
}

/**
 * RN-010: Standard CBT / ITF Bracket cross-over
 * For 4 groups (A, B, C, D) advancing top 2 (8 qualifiers):
 * Quarterfinals:
 * Match 1: 1º A vs 2º B -> winner to Semifinal 1 (PAIR_A)
 * Match 2: 1º C vs 2º D -> winner to Semifinal 1 (PAIR_B)
 * Match 3: 1º D vs 2º C -> winner to Semifinal 2 (PAIR_A)
 * Match 4: 1º B vs 2º A -> winner to Semifinal 2 (PAIR_B)
 * Semifinal 1 vs Semifinal 2 -> Final
 * This strictly ensures 1º A and 2º A can never meet until the Final!
 */
export function buildKnockoutBracket(
  qualifiers: QualifiedTeam[],
  bracketSize: number = 8
): BracketMatchDraft[] {
  const matches: BracketMatchDraft[] = [];

  if (bracketSize === 4) {
    // 2 Semifinals + 1 Final
    // Qualifiers: 1A, 2A, 1B, 2B
    const getTeam = (groupLetter: string, pos: number) =>
      qualifiers.find(
        (q) =>
          q.groupName.endsWith(groupLetter) && q.positionInGroup === pos
      )?.pairId || null;

    const semi1: BracketMatchDraft = {
      tempId: "SEMI_1",
      phase: "SEMIFINALS",
      round: 1,
      positionInBracket: 1,
      pairAId: getTeam("A", 1),
      pairBId: getTeam("B", 2),
      nextMatchTempId: "FINAL",
      nextMatchSlot: "PAIR_A",
    };

    const semi2: BracketMatchDraft = {
      tempId: "SEMI_2",
      phase: "SEMIFINALS",
      round: 1,
      positionInBracket: 2,
      pairAId: getTeam("B", 1),
      pairBId: getTeam("A", 2),
      nextMatchTempId: "FINAL",
      nextMatchSlot: "PAIR_B",
    };

    const finalMatch: BracketMatchDraft = {
      tempId: "FINAL",
      phase: "FINAL",
      round: 2,
      positionInBracket: 1,
      pairAId: null,
      pairBId: null,
      nextMatchTempId: null,
      nextMatchSlot: null,
    };

    matches.push(semi1, semi2, finalMatch);
    return matches;
  }

  if (bracketSize === 8) {
    // 4 Quarterfinals + 2 Semifinals + 1 Final
    const getTeam = (groupLetter: string, pos: number) =>
      qualifiers.find(
        (q) =>
          q.groupName.endsWith(groupLetter) && q.positionInGroup === pos
      )?.pairId || null;

    const qf1: BracketMatchDraft = {
      tempId: "QF_1",
      phase: "QUARTERFINALS",
      round: 1,
      positionInBracket: 1,
      pairAId: getTeam("A", 1),
      pairBId: getTeam("B", 2),
      nextMatchTempId: "SEMI_1",
      nextMatchSlot: "PAIR_A",
    };

    const qf2: BracketMatchDraft = {
      tempId: "QF_2",
      phase: "QUARTERFINALS",
      round: 1,
      positionInBracket: 2,
      pairAId: getTeam("C", 1),
      pairBId: getTeam("D", 2),
      nextMatchTempId: "SEMI_1",
      nextMatchSlot: "PAIR_B",
    };

    const qf3: BracketMatchDraft = {
      tempId: "QF_3",
      phase: "QUARTERFINALS",
      round: 1,
      positionInBracket: 3,
      pairAId: getTeam("D", 1),
      pairBId: getTeam("C", 2),
      nextMatchTempId: "SEMI_2",
      nextMatchSlot: "PAIR_A",
    };

    const qf4: BracketMatchDraft = {
      tempId: "QF_4",
      phase: "QUARTERFINALS",
      round: 1,
      positionInBracket: 4,
      pairAId: getTeam("B", 1),
      pairBId: getTeam("A", 2),
      nextMatchTempId: "SEMI_2",
      nextMatchSlot: "PAIR_B",
    };

    const semi1: BracketMatchDraft = {
      tempId: "SEMI_1",
      phase: "SEMIFINALS",
      round: 2,
      positionInBracket: 1,
      pairAId: null,
      pairBId: null,
      nextMatchTempId: "FINAL",
      nextMatchSlot: "PAIR_A",
    };

    const semi2: BracketMatchDraft = {
      tempId: "SEMI_2",
      phase: "SEMIFINALS",
      round: 2,
      positionInBracket: 2,
      pairAId: null,
      pairBId: null,
      nextMatchTempId: "FINAL",
      nextMatchSlot: "PAIR_B",
    };

    const finalMatch: BracketMatchDraft = {
      tempId: "FINAL",
      phase: "FINAL",
      round: 3,
      positionInBracket: 1,
      pairAId: null,
      pairBId: null,
      nextMatchTempId: null,
      nextMatchSlot: null,
    };

    matches.push(qf1, qf2, qf3, qf4, semi1, semi2, finalMatch);
    return matches;
  }

  // Fallback generic bracket generator for 16
  const numRounds = Math.log2(bracketSize);
  const phases: BracketPhase[] = [
    "ROUND_OF_16",
    "QUARTERFINALS",
    "SEMIFINALS",
    "FINAL",
  ];

  let currentRoundMatches: BracketMatchDraft[] = [];
  let nextRoundMatches: BracketMatchDraft[] = [];

  // Create rounds from final backwards to initial
  for (let r = numRounds; r >= 1; r--) {
    const matchesInRound = Math.pow(2, numRounds - r);
    const phase =
      r === numRounds
        ? "FINAL"
        : r === numRounds - 1
        ? "SEMIFINALS"
        : r === numRounds - 2
        ? "QUARTERFINALS"
        : "ROUND_OF_16";

    currentRoundMatches = [];
    for (let m = 1; m <= matchesInRound; m++) {
      const matchId = `${phase}_${m}`;
      let nextId: string | null = null;
      let slot: "PAIR_A" | "PAIR_B" | null = null;

      if (r < numRounds) {
        const parentMatchIdx = Math.ceil(m / 2);
        const parentPhase =
          r + 1 === numRounds
            ? "FINAL"
            : r + 1 === numRounds - 1
            ? "SEMIFINALS"
            : "QUARTERFINALS";
        nextId = `${parentPhase}_${parentMatchIdx}`;
        slot = m % 2 === 1 ? "PAIR_A" : "PAIR_B";
      }

      currentRoundMatches.push({
        tempId: matchId,
        phase,
        round: r,
        positionInBracket: m,
        pairAId: null,
        pairBId: null,
        nextMatchTempId: nextId,
        nextMatchSlot: slot,
      });
    }

    // If it's round 1, assign qualifiers
    if (r === 1) {
      for (let i = 0; i < currentRoundMatches.length; i++) {
        const qA = qualifiers[i * 2];
        const qB = qualifiers[i * 2 + 1];
        if (qA) currentRoundMatches[i].pairAId = qA.pairId;
        if (qB) currentRoundMatches[i].pairBId = qB.pairId;
      }
    }

    matches.unshift(...currentRoundMatches);
  }

  return matches;
}
