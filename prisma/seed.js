const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do Torneio Open Viva By Baumann 2026...");

  // Limpeza
  await prisma.match.deleteMany({});
  await prisma.pair.deleteMany({});
  await prisma.court.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.tournamentSettings.deleteMany({});
  await prisma.tournament.deleteMany({});
  await prisma.athlete.deleteMany({});

  // 1. Criar Torneio
  const tournament = await prisma.tournament.create({
    data: {
      name: "Torneio Open Viva By Baumann 2026",
      location: "Arena Viva Beach Club - Complexo Central",
      startDate: new Date("2026-09-19T08:00:00Z"),
      endDate: new Date("2026-09-20T21:00:00Z"),
      status: "ACTIVE",
      organizer: "Daniel Baumann / Viva By Baumann",
      notes:
        "Regulamento oficial CBT / ITF. Fase de grupos: 1 set até 6 games (com tiebreak até 7 em 5x5). Semifinais e Finais em Pro Set até 9 games. Aquecimento obrigatório: 5 minutos.",
    },
  });

  // Settings
  await prisma.tournamentSettings.create({
    data: {
      tournamentId: tournament.id,
      avgMatchDurationMinutes: 45,
      warmupDurationMinutes: 5,
      intervalBetweenMatchesMinutes: 5,
      restBetweenMatchesMinutes: 30,
      dailyTimeWindows: JSON.stringify([
        { date: "2026-09-19", startTime: "08:00", endTime: "22:00" },
        { date: "2026-09-20", startTime: "08:00", endTime: "21:00" },
      ]),
    },
  });

  // 2. Criar 6 Quadras
  const courts = [];
  const courtDefs = [
    { name: "Quadra 1 (Central)", type: "SAND", status: "OCCUPIED", displayOrder: 1 },
    { name: "Quadra 2", type: "SAND", status: "OCCUPIED", displayOrder: 2 },
    { name: "Quadra 3", type: "SAND", status: "OCCUPIED", displayOrder: 3 },
    { name: "Quadra 4", type: "SAND", status: "AVAILABLE", displayOrder: 4 },
    { name: "Quadra 5 (Coberta)", type: "INDOOR_SAND", status: "OCCUPIED", displayOrder: 5 },
    { name: "Quadra 6 (Coberta)", type: "INDOOR_SAND", status: "AVAILABLE", displayOrder: 6 },
  ];

  for (const c of courtDefs) {
    const court = await prisma.court.create({
      data: {
        tournamentId: tournament.id,
        name: c.name,
        type: c.type,
        status: c.status,
        displayOrder: c.displayOrder,
      },
    });
    courts.push(court);
  }

  // 3. Criar Atletas (64 atletas)
  const athleteNames = [
    // Masc Open (16 atletas / 8 duplas)
    "Gabriel Silva", "Rodrigo Santos", "Lucas Ferreira", "Daniel Baumann",
    "Felipe Martins", "Tiago Gomes", "Matheus Andrade", "Pedro Ribeiro",
    "Bruno Carvalho", "Vinicius Freitas", "Rafael Castro", "Diego Batista",
    "Leonardo Macedo", "Eduardo Ramos", "Guilherme Nogueira", "Arthur Fontes",
    // Fem B (16 atletas / 8 duplas)
    "Mariana Lima", "Camila Albuquerque", "Juliana Rocha", "Beatriz Menezes",
    "Larissa Costa", "Fernanda Pereira", "Aline Souza", "Patricia Barbosa",
    "Carolina Alves", "Renata Nunes", "Vanessa Moreira", "Isabela Duarte",
    "Leticia Mendes", "Tatiana Farias", "Helena Siqueira", "Priscila Rossi",
    // Mista C (16 atletas / 8 duplas)
    "Carlos Dias", "Amanda Silveira", "Marcos Antunes", "Jessica Prado",
    "Alexandre Peixoto", "Natalia Miranda", "Gustavo Rezende", "Bianca Lemos",
    "Ricardo Vasconcelos", "Debora Pires", "Caio Toledo", "Daniela Guimarães",
    "Fábio Meirelles", "Paula Cardoso", "Marcelo Vianna", "Luana Barreto",
    // Iniciantes (16 atletas / 8 duplas)
    "Enzo Pascoal", "Murilo Telles", "Samuel Brandão", "Heitor Caldeira",
    "Breno Castilho", "Caio Aguiar", "Davi Simões", "Danilo Tavares",
    "Renan Cortez", "Yuri Morais", "Victor Guedes", "Otavio Bueno",
    "Igor Camargo", "Lorenzo Vilela", "Theo Sanches", "Joaquim Fontoura"
  ];

  const athletes = [];
  for (let i = 0; i < athleteNames.length; i++) {
    const a = await prisma.athlete.create({
      data: {
        fullName: athleteNames[i],
        phone: `(11) 98765-${String(1000 + i).padStart(4, "0")}`,
        email: `${athleteNames[i].toLowerCase().replace(/\s+/g, ".")}@vivasports.com.br`,
        gender: i < 16 ? "MALE" : i < 32 ? "FEMALE" : i < 48 ? (i % 2 === 0 ? "MALE" : "FEMALE") : "MALE",
        club: i % 3 === 0 ? "Viva Arena Baumann" : i % 3 === 1 ? "Beach Point SP" : "Sand Paradise Club",
      },
    });
    athletes.push(a);
  }

  // 4. Criar 4 Categorias
  const catMascOpen = await prisma.category.create({
    data: {
      tournamentId: tournament.id,
      name: "Masc Open",
      type: "DUPLA_MASC",
      maxPairs: 8,
      format: "GROUPS_AND_KNOCKOUT",
      groupCount: 2,
      advancePerGroup: 2,
      bracketSize: 4,
      matchRule: "ONE_STANDARD_SET_6",
    },
  });

  const catFemB = await prisma.category.create({
    data: {
      tournamentId: tournament.id,
      name: "Fem B",
      type: "DUPLA_FEM",
      maxPairs: 8,
      format: "GROUPS_AND_KNOCKOUT",
      groupCount: 2,
      advancePerGroup: 2,
      bracketSize: 4,
      matchRule: "ONE_STANDARD_SET_6",
    },
  });

  const catMistaC = await prisma.category.create({
    data: {
      tournamentId: tournament.id,
      name: "Mista C",
      type: "DUPLA_MISTA",
      maxPairs: 8,
      format: "GROUPS_AND_KNOCKOUT",
      groupCount: 2,
      advancePerGroup: 2,
      bracketSize: 4,
      matchRule: "ONE_STANDARD_SET_6",
    },
  });

  const catIniciantes = await prisma.category.create({
    data: {
      tournamentId: tournament.id,
      name: "Iniciantes",
      type: "DUPLA_MASC",
      maxPairs: 8,
      format: "GROUPS_AND_KNOCKOUT",
      groupCount: 2,
      advancePerGroup: 2,
      bracketSize: 4,
      matchRule: "ONE_STANDARD_SET_6",
    },
  });

  // 5. Criar Duplas (8 por categoria = 32 duplas)
  async function createPairsForCat(catId, startIndex, seedRankings) {
    const catPairs = [];
    for (let p = 0; p < 8; p++) {
      const a1 = athletes[startIndex + p * 2];
      const a2 = athletes[startIndex + p * 2 + 1];
      const seed = seedRankings[p] || null;
      const pair = await prisma.pair.create({
        data: {
          categoryId: catId,
          athlete1Id: a1.id,
          athlete2Id: a2.id,
          seedRanking: seed,
          status: "CONFIRMED",
        },
      });
      catPairs.push(pair);
    }
    return catPairs;
  }

  const pairsMasc = await createPairsForCat(catMascOpen.id, 0, [1, 2, 3, 4, null, null, null, null]);
  const pairsFem = await createPairsForCat(catFemB.id, 16, [1, 2, 3, 4, null, null, null, null]);
  const pairsMista = await createPairsForCat(catMistaC.id, 32, [1, 2, null, null, null, null, null, null]);
  const pairsIniciantes = await createPairsForCat(catIniciantes.id, 48, [1, 2, null, null, null, null, null, null]);

  // 6. Criar Jogos nos Vários Estágios
  // 6.1 Masc Open: Fase de grupos já concluída e Semifinais criadas (1 AO VIVO na Quadra 1)
  // Semifinal 1 (AO VIVO na Quadra 1)
  const now = new Date();
  const started28m = new Date(now.getTime() - 28 * 60 * 1000);
  const started35m = new Date(now.getTime() - 35 * 60 * 1000);
  const started42m = new Date(now.getTime() - 42 * 60 * 1000);
  const started15m = new Date(now.getTime() - 15 * 60 * 1000);

  // Semifinal 1
  const mascSemi1 = await prisma.match.create({
    data: {
      categoryId: catMascOpen.id,
      phase: "SEMIFINALS",
      round: 1,
      positionInBracket: 1,
      pairAId: pairsMasc[0].id, // Silva / Santos
      pairBId: pairsMasc[1].id, // Ferreira / Baumann
      scoreA: 6,
      scoreB: 4,
      setsDetail: JSON.stringify([{ set: 1, gamesA: 6, gamesB: 4 }]),
      status: "LIVE",
      courtId: courts[0].id, // Quadra 1
      scheduledTime: started28m,
      startedAt: started28m,
    },
  });

  // Semifinal 2 (AO VIVO na Quadra 5)
  const mascSemi2 = await prisma.match.create({
    data: {
      categoryId: catMascOpen.id,
      phase: "SEMIFINALS",
      round: 1,
      positionInBracket: 2,
      pairAId: pairsMasc[2].id, // Martins / Gomes
      pairBId: pairsMasc[3].id, // Andrade / Ribeiro
      scoreA: 3,
      scoreB: 2,
      setsDetail: JSON.stringify([{ set: 1, gamesA: 3, gamesB: 2 }]),
      status: "LIVE",
      courtId: courts[4].id, // Quadra 5
      scheduledTime: started15m,
      startedAt: started15m,
    },
  });

  // Final Masc Open (Aguardando vencedores)
  await prisma.match.create({
    data: {
      categoryId: catMascOpen.id,
      phase: "FINAL",
      round: 2,
      positionInBracket: 1,
      pairAId: null,
      pairBId: null,
      scoreA: 0,
      scoreB: 0,
      status: "SCHEDULED",
      scheduledTime: new Date(now.getTime() + 90 * 60 * 1000),
    },
  });

  // 6.2 Fem B - Partidas de Grupo
  // Grupo A: Match AO VIVO na Quadra 2
  await prisma.match.create({
    data: {
      categoryId: catFemB.id,
      phase: "GROUP_STAGE",
      groupId: "Grupo A",
      round: 2,
      pairAId: pairsFem[0].id, // Lima / Albuquerque
      pairBId: pairsFem[1].id, // Rocha / Menezes
      scoreA: 4,
      scoreB: 5,
      setsDetail: JSON.stringify([{ set: 1, gamesA: 4, gamesB: 5 }]),
      status: "LIVE",
      courtId: courts[1].id, // Quadra 2
      scheduledTime: started35m,
      startedAt: started35m,
    },
  });

  // Grupo A: Match Finalizado
  await prisma.match.create({
    data: {
      categoryId: catFemB.id,
      phase: "GROUP_STAGE",
      groupId: "Grupo A",
      round: 1,
      pairAId: pairsFem[0].id,
      pairBId: pairsFem[2].id,
      scoreA: 6,
      scoreB: 2,
      setsDetail: JSON.stringify([{ set: 1, gamesA: 6, gamesB: 2 }]),
      winnerPairId: pairsFem[0].id,
      status: "FINISHED",
      scheduledTime: new Date(now.getTime() - 90 * 60 * 1000),
      finishedAt: new Date(now.getTime() - 40 * 60 * 1000),
    },
  });

  // 6.3 Mista C - Match AO VIVO na Quadra 3
  await prisma.match.create({
    data: {
      categoryId: catMistaC.id,
      phase: "GROUP_STAGE",
      groupId: "Grupo B",
      round: 2,
      pairAId: pairsMista[0].id, // Costa / Pereira
      pairBId: pairsMista[1].id, // Souza / Barbosa
      scoreA: 7,
      scoreB: 8,
      setsDetail: JSON.stringify([{ set: 1, gamesA: 7, gamesB: 8 }]),
      status: "LIVE",
      courtId: courts[2].id, // Quadra 3
      scheduledTime: started42m,
      startedAt: started42m,
    },
  });

  // 6.4 Fila de Espera / Próximos Jogos (WAITING_COURT) para o Telão e Painel de Operador
  // [1] Próximo jogo: Aguardando liberação para Quadra 4
  await prisma.match.create({
    data: {
      categoryId: catIniciantes.id,
      phase: "GROUP_STAGE",
      groupId: "Grupo A",
      round: 1,
      pairAId: pairsIniciantes[0].id,
      pairBId: pairsIniciantes[1].id,
      scoreA: 0,
      scoreB: 0,
      status: "WAITING_COURT",
      scheduledTime: new Date(now.getTime() + 10 * 60 * 1000),
    },
  });

  // [2] Próximo jogo da fila
  await prisma.match.create({
    data: {
      categoryId: catMistaC.id,
      phase: "GROUP_STAGE",
      groupId: "Grupo A",
      round: 1,
      pairAId: pairsMista[2].id,
      pairBId: pairsMista[3].id,
      scoreA: 0,
      scoreB: 0,
      status: "WAITING_COURT",
      scheduledTime: new Date(now.getTime() + 25 * 60 * 1000),
    },
  });

  // [3] Próximo jogo da fila
  await prisma.match.create({
    data: {
      categoryId: catFemB.id,
      phase: "GROUP_STAGE",
      groupId: "Grupo B",
      round: 1,
      pairAId: pairsFem[2].id,
      pairBId: pairsFem[3].id,
      scoreA: 0,
      scoreB: 0,
      status: "WAITING_COURT",
      scheduledTime: new Date(now.getTime() + 40 * 60 * 1000),
    },
  });

  // Mais alguns agendados para a grade horária
  for (let i = 4; i < 7; i++) {
    await prisma.match.create({
      data: {
        categoryId: catIniciantes.id,
        phase: "GROUP_STAGE",
        groupId: "Grupo B",
        round: 1,
        pairAId: pairsIniciantes[i].id,
        pairBId: pairsIniciantes[i + 1]?.id || pairsIniciantes[0].id,
        scoreA: 0,
        scoreB: 0,
        status: "SCHEDULED",
        scheduledTime: new Date(now.getTime() + (60 + i * 30) * 60 * 1000),
      },
    });
  }

  console.log("Seed concluído com sucesso!");
  console.log(`Torneio ID: ${tournament.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
