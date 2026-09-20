import { GroupStanding, parseSetsDetail, formatPairName } from "./types";

export interface PairForGroup {
  id: string;
  seedRanking?: number | null;
  athlete1: { fullName: string };
  athlete2: { fullName: string };
}

/**
 * Distributes pairs into groups using serpentine distribution or random shuffle
 */
export function distributePairsIntoGroups(
  pairs: PairForGroup[],
  groupCount: number,
  mode: "SERPENTINE" | "RANDOM" = "SERPENTINE"
): { groupName: string; pairs: PairForGroup[] }[] {
  const groups: { groupName: string; pairs: PairForGroup[] }[] = [];
  for (let i = 0; i < groupCount; i++) {
    const letter = String.fromCharCode(65 + i); // 'A', 'B', 'C', ...
    groups.push({ groupName: `Grupo ${letter}`, pairs: [] });
  }

  if (pairs.length === 0) return groups;

  let sortedPairs = [...pairs];
  if (mode === "SERPENTINE") {
    // Sort by seed ranking (seeds 1, 2, 3... first; unseeded randomly/preserve order)
    sortedPairs.sort((a, b) => {
      const seedA = a.seedRanking ?? 9999;
      const seedB = b.seedRanking ?? 9999;
      return seedA - seedB;
    });
  } else {
    // Shuffle
    sortedPairs.sort(() => Math.random() - 0.5);
  }

  // Serpentine allocation:
  // Row 0: 0 -> groupCount - 1
  // Row 1: groupCount - 1 -> 0
  // Row 2: 0 -> groupCount - 1
  let direction = 1;
  let currentGroupIdx = 0;

  for (let i = 0; i < sortedPairs.length; i++) {
    groups[currentGroupIdx].pairs.push(sortedPairs[i]);

    if (direction === 1) {
      if (currentGroupIdx === groupCount - 1) {
        direction = -1; // change direction, stay at same group for next row
      } else {
        currentGroupIdx++;
      }
    } else {
      if (currentGroupIdx === 0) {
        direction = 1;
      } else {
        currentGroupIdx--;
      }
    }
  }

  return groups;
}

/**
 * Generates Round-Robin pairings for a group
 */
export function generateRoundRobinMatches(
  pairs: PairForGroup[],
  groupName: string
): { pairAId: string; pairBId: string; round: number; groupId: string }[] {
  const matches: {
    pairAId: string;
    pairBId: string;
    round: number;
    groupId: string;
  }[] = [];

  const n = pairs.length;
  if (n < 2) return [];

  // Berger tables or round-robin rotation
  const teamList = [...pairs.map((p) => p.id)];
  if (n % 2 !== 0) {
    teamList.push("BYE");
  }

  const totalRounds = teamList.length - 1;
  const half = teamList.length / 2;

  for (let round = 1; round <= totalRounds; round++) {
    for (let i = 0; i < half; i++) {
      const t1 = teamList[i];
      const t2 = teamList[teamList.length - 1 - i];

      if (t1 !== "BYE" && t2 !== "BYE") {
        matches.push({
          pairAId: t1,
          pairBId: t2,
          round,
          groupId: groupName,
        });
      }
    }

    // Rotate array preserving index 0
    const fixed = teamList[0];
    const rest = teamList.slice(1);
    const last = rest.pop()!;
    rest.unshift(last);
    teamList.splice(0, teamList.length, fixed, ...rest);
  }

  return matches;
}

/**
 * RN-004: Hierarchical group standings calculation
 * 1. Most wins
 * 2. Head-to-head between 2 tied pairs
 * 3. Set difference
 * 4. Game difference
 * 5. Seed / draw
 */
export function calculateGroupStandings(
  pairs: PairForGroup[],
  matches: Array<{
    pairAId: string | null;
    pairBId: string | null;
    scoreA: number;
    scoreB: number;
    setsDetail: string;
    winnerPairId: string | null;
    status: string;
  }>,
  advancePerGroup: number = 2
): GroupStanding[] {
  const standingsMap = new Map<string, GroupStanding>();

  for (const pair of pairs) {
    standingsMap.set(pair.id, {
      pairId: pair.id,
      pairName: formatPairName(pair),
      athlete1Name: pair.athlete1.fullName,
      athlete2Name: pair.athlete2.fullName,
      seed: pair.seedRanking,
      played: 0,
      won: 0,
      lost: 0,
      setsWon: 0,
      setsLost: 0,
      setsDiff: 0,
      gamesWon: 0,
      gamesLost: 0,
      gamesDiff: 0,
      qualified: false,
      position: 1,
    });
  }

  // Tally matches
  for (const m of matches) {
    if (m.status !== "FINISHED" && !m.status.startsWith("WALKOVER")) continue;
    if (!m.pairAId || !m.pairBId) continue;

    const sA = standingsMap.get(m.pairAId);
    const sB = standingsMap.get(m.pairBId);
    if (!sA || !sB) continue;

    sA.played++;
    sB.played++;

    const isAWinner = m.winnerPairId === m.pairAId;
    const isBWinner = m.winnerPairId === m.pairBId;

    if (isAWinner) {
      sA.won++;
      sB.lost++;
    } else if (isBWinner) {
      sB.won++;
      sA.lost++;
    }

    const sets = parseSetsDetail(m.setsDetail);
    if (sets.length > 0) {
      let setsWonA = 0;
      let setsWonB = 0;
      let gamesWonA = 0;
      let gamesWonB = 0;

      for (const s of sets) {
        gamesWonA += s.gamesA;
        gamesWonB += s.gamesB;
        if (s.gamesA > s.gamesB) setsWonA++;
        else if (s.gamesB > s.gamesA) setsWonB++;
      }

      sA.setsWon += setsWonA;
      sA.setsLost += setsWonB;
      sB.setsWon += setsWonB;
      sB.setsLost += setsWonA;

      sA.gamesWon += gamesWonA;
      sA.gamesLost += gamesWonB;
      sB.gamesWon += gamesWonB;
      sB.gamesLost += gamesWonA;
    } else {
      // Fallback if setsDetail empty: use scoreA/scoreB
      sA.gamesWon += m.scoreA;
      sA.gamesLost += m.scoreB;
      sB.gamesWon += m.scoreB;
      sB.gamesLost += m.scoreA;
    }
  }

  // Compute diffs
  for (const s of Array.from(standingsMap.values())) {
    s.setsDiff = s.setsWon - s.setsLost;
    s.gamesDiff = s.gamesWon - s.gamesLost;
  }

  const list = Array.from(standingsMap.values());

  // Sorting with RN-004 rules
  list.sort((a, b) => {
    // 1. Vitórias
    if (b.won !== a.won) return b.won - a.won;

    // Check if exactly 2 are tied in wins
    const tiedInWins = list.filter((item) => item.won === a.won);
    if (tiedInWins.length === 2) {
      // 2. Confronto Direto
      const headToHead = matches.find(
        (m) =>
          (m.status === "FINISHED" || m.status.startsWith("WALKOVER")) &&
          ((m.pairAId === a.pairId && m.pairBId === b.pairId) ||
            (m.pairAId === b.pairId && m.pairBId === a.pairId))
      );
      if (headToHead?.winnerPairId) {
        if (headToHead.winnerPairId === a.pairId) return -1;
        if (headToHead.winnerPairId === b.pairId) return 1;
      }
    }

    // 3. Saldo de Sets
    if (b.setsDiff !== a.setsDiff) return b.setsDiff - a.setsDiff;

    // 4. Saldo de Games
    if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff;

    // 5. Total de Games Vencidos
    if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;

    // 6. Cabeça de chave
    const seedA = a.seed ?? 999;
    const seedB = b.seed ?? 999;
    return seedA - seedB;
  });

  list.forEach((item, index) => {
    item.position = index + 1;
    item.qualified = item.position <= advancePerGroup;
  });

  return list;
}
