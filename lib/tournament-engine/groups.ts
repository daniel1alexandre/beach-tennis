import { GroupStanding, parseSetsDetail, formatPairName } from "./types";

export interface PairForGroup {
  id: string;
  seedRanking?: number | null;
  athlete1: { fullName: string; club?: string | null };
  athlete2: { fullName: string; club?: string | null };
}

/**
 * Determina a quantidade oficial de grupos segundo o Regulamento CBT (Beach Tennis).
 * A regra oficial estipula prioritariamente grupos de 3 ou 4 duplas:
 * - 2 a 5 duplas: 1 Grupo único (Round-Robin todos contra todos)
 * - 6 a 8 duplas: 2 Grupos (3 a 4 duplas por grupo)
 * - 9 a 11 duplas: 3 Grupos (3 a 4 duplas por grupo)
 * - 12 a 15 duplas: 4 Grupos (3 a 4 duplas por grupo)
 * - 16 a 19 duplas: 5 Grupos (3 a 4 duplas por grupo)
 * - 20 a 23 duplas: 6 Grupos (3 a 4 duplas por grupo)
 * - 24 a 27 duplas: 7 Grupos (3 a 4 duplas por grupo)
 * - 28 a 32 duplas: 8 Grupos (3 a 4 duplas por grupo)
 * - > 32 duplas: floor(pairCount / 3) grupos
 */
export function calculateCBTGroupCount(pairCount: number): {
  groupCount: number;
  advancePerGroup: number;
  bracketSize: number;
  description: string;
} {
  if (pairCount <= 1) {
    return { groupCount: 1, advancePerGroup: 1, bracketSize: 2, description: "1 dupla (insuficiente para chave)" };
  }
  if (pairCount <= 5) {
    return { groupCount: 1, advancePerGroup: 2, bracketSize: 2, description: "1 Grupo único (todos contra todos)" };
  }
  if (pairCount <= 8) {
    return { groupCount: 2, advancePerGroup: 2, bracketSize: 4, description: "2 Grupos (3 a 4 duplas/grupo -> Semis)" };
  }
  if (pairCount <= 11) {
    return { groupCount: 3, advancePerGroup: 2, bracketSize: 8, description: "3 Grupos (3 a 4 duplas/grupo -> Quartas)" };
  }
  if (pairCount <= 15) {
    return { groupCount: 4, advancePerGroup: 2, bracketSize: 8, description: "4 Grupos (3 a 4 duplas/grupo -> Quartas)" };
  }
  if (pairCount <= 19) {
    return { groupCount: 5, advancePerGroup: 2, bracketSize: 16, description: "5 Grupos (3 a 4 duplas/grupo -> Oitavas)" };
  }
  if (pairCount <= 23) {
    return { groupCount: 6, advancePerGroup: 2, bracketSize: 16, description: "6 Grupos (3 a 4 duplas/grupo -> Oitavas)" };
  }
  if (pairCount <= 27) {
    return { groupCount: 7, advancePerGroup: 2, bracketSize: 16, description: "7 Grupos (3 a 4 duplas/grupo -> Oitavas)" };
  }
  if (pairCount <= 32) {
    return { groupCount: 8, advancePerGroup: 2, bracketSize: 16, description: "8 Grupos (3 a 4 duplas/grupo -> Oitavas)" };
  }
  const groups = Math.max(1, Math.floor(pairCount / 3));
  return {
    groupCount: groups,
    advancePerGroup: 2,
    bracketSize: 32,
    description: `${groups} Grupos (norma CBT 3-4 duplas/grupo)`,
  };
}

/**
 * Distributes pairs into groups respecting CBT (Confederação Brasileira de Tennis) Beach Tennis Regulations:
 * 1. Cabeças de Chave (Seeds) distribution:
 *    - Cabeça 1 obrigatoriamente no Grupo A (Posição 1)
 *    - Cabeça 2 obrigatoriamente no Grupo B (Posição 1)
 *    - Cabeças 3 e 4 distribuídos nos Grupos C e D
 *    - Cabeças 5 a 8 distribuídos nos Grupos E a H
 * 2. Distribuição das demais duplas (Potes / Sorteio dirigido):
 *    - Duplas são alocadas buscando equilibrar o tamanho dos grupos.
 *    - Proteção de Agremiação/Clube: duplas do mesmo clube/academia são distribuídas
 *      em grupos diferentes sempre que possível, evitando confrontos prematuros de mesma agremiação.
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

  if (pairs.length === 0 || groupCount <= 0) return groups;

  // Separate seeded pairs from unseeded pairs
  const seededPairs = pairs
    .filter((p) => p.seedRanking && p.seedRanking > 0)
    .sort((a, b) => (a.seedRanking || 999) - (b.seedRanking || 999));

  const unseededPairs = pairs.filter(
    (p) => !p.seedRanking || p.seedRanking <= 0
  );

  if (mode === "RANDOM") {
    unseededPairs.sort(() => Math.random() - 0.5);
  }

  // 1. Alocação dos Cabeças de Chave conforme norma CBT
  // Até 1 cabeça por grupo como Posição 1
  const headsOfGroup = Math.min(groupCount, seededPairs.length);
  for (let i = 0; i < headsOfGroup; i++) {
    let targetGroupIdx = i;

    // Regra CBT: Cabeça 1 no Grupo A (idx 0), Cabeça 2 no Grupo B (idx 1)
    // Para cabeças 3 e 4 em 4 grupos: Grupo C e Grupo D
    if (i === 0) targetGroupIdx = 0;
    else if (i === 1 && groupCount > 1) targetGroupIdx = 1;
    else if (i === 2 && groupCount > 2) targetGroupIdx = 2;
    else if (i === 3 && groupCount > 3) targetGroupIdx = 3;

    groups[targetGroupIdx].pairs.push(seededPairs[i]);
  }

  // Demais cabeças de chave além do número de grupos se houver
  const remainingSeeds = seededPairs.slice(headsOfGroup);
  const poolToDistribute = [...remainingSeeds, ...unseededPairs];

  // 2. Distribuição das demais duplas (Serpentina com Proteção de Clube CBT)
  let direction = -1; // Next row comes back
  let currentGroupIdx = groupCount - 1;

  for (const pair of poolToDistribute) {
    // Tenta encontrar o melhor grupo respeitando proteção de clube CBT
    const pairClub1 = pair.athlete1.club?.trim().toLowerCase();
    const pairClub2 = pair.athlete2.club?.trim().toLowerCase();

    let chosenGroupIdx = currentGroupIdx;

    // Se no grupo atual já tiver dupla do mesmo clube e outros grupos tiverem mesmo tamanho mínimo, tenta alocar no outro grupo
    if (pairClub1 || pairClub2) {
      const minGroupSize = Math.min(...groups.map((g) => g.pairs.length));
      for (let offset = 0; offset < groupCount; offset++) {
        const testIdx = (currentGroupIdx + offset) % groupCount;
        const g = groups[testIdx];
        if (g.pairs.length === minGroupSize) {
          const hasSameClub = g.pairs.some((p) => {
            const c1 = p.athlete1.club?.trim().toLowerCase();
            const c2 = p.athlete2.club?.trim().toLowerCase();
            return (
              (pairClub1 && (pairClub1 === c1 || pairClub1 === c2)) ||
              (pairClub2 && (pairClub2 === c1 || pairClub2 === c2))
            );
          });
          if (!hasSameClub) {
            chosenGroupIdx = testIdx;
            break;
          }
        }
      }
    }

    groups[chosenGroupIdx].pairs.push(pair);

    // Avança índice na lógica serpentina
    if (direction === 1) {
      if (currentGroupIdx >= groupCount - 1) {
        direction = -1;
      } else {
        currentGroupIdx++;
      }
    } else {
      if (currentGroupIdx <= 0) {
        direction = 1;
      } else {
        currentGroupIdx--;
      }
    }
  }

  return groups;
}

/**
 * Generates Round-Robin pairings for a group following CBT Berger tables
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

  // Ordem oficial CBT para grupos de 3 duplas:
  // R1: 1 vs 3 (folga 2)
  // R2: Perdedor R1 vs 2
  // R3: Vencedor R1 vs 2
  // No agendamento preliminar estático: (1 vs 3), (2 vs 3), (1 vs 2)
  if (n === 3) {
    return [
      { pairAId: pairs[0].id, pairBId: pairs[2].id, round: 1, groupId: groupName },
      { pairAId: pairs[1].id, pairBId: pairs[2].id, round: 2, groupId: groupName },
      { pairAId: pairs[0].id, pairBId: pairs[1].id, round: 3, groupId: groupName },
    ];
  }

  // Berger tables para n duplas
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

    // Rotaciona mantendo índice 0 fixo
    const fixed = teamList[0];
    const rest = teamList.slice(1);
    const last = rest.pop()!;
    rest.unshift(last);
    teamList.splice(0, teamList.length, fixed, ...rest);
  }

  return matches;
}

/**
 * Critérios Oficiais de Desempate da CBT (Confederação Brasileira de Tennis - Beach Tennis):
 * 1. Maior número de vitórias;
 * 2. No caso de empate entre 2 (duas) duplas: Confronto direto;
 * 3. No caso de empate entre 3 (três) ou mais duplas (empate triplo/múltiplo):
 *    a) Maior saldo de sets APENAS nos confrontos entre as duplas empatadas;
 *    b) Se persistir empate entre 2 duplas: confronto direto entre elas;
 *    c) Se persistir entre 3: maior saldo de games APENAS nos confrontos entre si;
 *    d) Saldo de sets em todos os jogos do grupo;
 *    e) Saldo de games em todos os jogos do grupo;
 *    f) Maior percentual de games ganhos (Games Pró / (Games Pró + Games Contra));
 *    g) Cabeça de chave / Sorteio.
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

  // Apuração de todos os jogos do grupo
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
      // Fallback sem detalhe de sets
      sA.gamesWon += m.scoreA;
      sA.gamesLost += m.scoreB;
      sB.gamesWon += m.scoreB;
      sB.gamesLost += m.scoreA;
      if (isAWinner) {
        sA.setsWon += 1;
        sB.setsLost += 1;
      } else if (isBWinner) {
        sB.setsWon += 1;
        sA.setsLost += 1;
      }
    }
  }

  // Calcula saldos gerais
  for (const s of Array.from(standingsMap.values())) {
    s.setsDiff = s.setsWon - s.setsLost;
    s.gamesDiff = s.gamesWon - s.gamesLost;
  }

  const list = Array.from(standingsMap.values());

  // Helper para mini-tabela entre empatados (Regra CBT Empate Múltiplo)
  const getMiniTableStats = (tiedPairIds: string[]) => {
    const stats: Record<string, { setsDiff: number; gamesDiff: number; gamesWon: number; gamesLost: number }> = {};
    for (const id of tiedPairIds) {
      stats[id] = { setsDiff: 0, gamesDiff: 0, gamesWon: 0, gamesLost: 0 };
    }

    for (const m of matches) {
      if (m.status !== "FINISHED" && !m.status.startsWith("WALKOVER")) continue;
      if (!m.pairAId || !m.pairBId) continue;
      if (tiedPairIds.includes(m.pairAId) && tiedPairIds.includes(m.pairBId)) {
        const sets = parseSetsDetail(m.setsDetail);
        let sA = 0, sB = 0, gA = 0, gB = 0;
        if (sets.length > 0) {
          for (const s of sets) {
            gA += s.gamesA;
            gB += s.gamesB;
            if (s.gamesA > s.gamesB) sA++;
            else if (s.gamesB > s.gamesA) sB++;
          }
        } else {
          gA = m.scoreA;
          gB = m.scoreB;
          if (m.winnerPairId === m.pairAId) sA = 1;
          else if (m.winnerPairId === m.pairBId) sB = 1;
        }

        stats[m.pairAId].setsDiff += (sA - sB);
        stats[m.pairAId].gamesDiff += (gA - gB);
        stats[m.pairAId].gamesWon += gA;
        stats[m.pairAId].gamesLost += gB;

        stats[m.pairBId].setsDiff += (sB - sA);
        stats[m.pairBId].gamesDiff += (gB - gA);
        stats[m.pairBId].gamesWon += gB;
        stats[m.pairBId].gamesLost += gA;
      }
    }

    return stats;
  };

  // Ordenação com os critérios estritos da CBT
  list.sort((a, b) => {
    // 1. Vitórias
    if (b.won !== a.won) return b.won - a.won;

    const tiedPairsWithSameWins = list.filter((item) => item.won === a.won);

    // 2. Empate entre exatamente 2 duplas -> Confronto Direto
    if (tiedPairsWithSameWins.length === 2) {
      const h2h = matches.find(
        (m) =>
          (m.status === "FINISHED" || m.status.startsWith("WALKOVER")) &&
          ((m.pairAId === a.pairId && m.pairBId === b.pairId) ||
            (m.pairAId === b.pairId && m.pairBId === a.pairId))
      );
      if (h2h?.winnerPairId) {
        if (h2h.winnerPairId === a.pairId) return -1;
        if (h2h.winnerPairId === b.pairId) return 1;
      }
    }

    // 3. Empate Múltiplo (3 ou mais duplas) -> Mini-tabela entre as empatadas
    if (tiedPairsWithSameWins.length >= 3) {
      const miniStats = getMiniTableStats(tiedPairsWithSameWins.map((p) => p.pairId));
      const aMini = miniStats[a.pairId];
      const bMini = miniStats[b.pairId];

      if (aMini && bMini) {
        // a) Saldo de sets nos jogos entre si
        if (bMini.setsDiff !== aMini.setsDiff) {
          return bMini.setsDiff - aMini.setsDiff;
        }
        // b) Saldo de games nos jogos entre si
        if (bMini.gamesDiff !== aMini.gamesDiff) {
          return bMini.gamesDiff - aMini.gamesDiff;
        }
      }
    }

    // 4. Saldo de Sets geral
    if (b.setsDiff !== a.setsDiff) return b.setsDiff - a.setsDiff;

    // 5. Saldo de Games geral
    if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff;

    // 6. Percentual de games ganhos (Games Pró / Total de games)
    const pctA = a.gamesWon + a.gamesLost > 0 ? a.gamesWon / (a.gamesWon + a.gamesLost) : 0;
    const pctB = b.gamesWon + b.gamesLost > 0 ? b.gamesWon / (b.gamesWon + b.gamesLost) : 0;
    if (pctB !== pctA) return pctB - pctA;

    // 7. Cabeça de chave CBT
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
