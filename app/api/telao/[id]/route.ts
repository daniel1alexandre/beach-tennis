import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const tournamentId = params.id;

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, name: true, location: true, status: true },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 });
    }

    // Courts with displayOrder
    const courts = await prisma.court.findMany({
      where: { tournamentId },
      orderBy: { displayOrder: "asc" },
      include: {
        matches: {
          where: { status: { in: ["LIVE", "WARMUP"] } },
          include: {
            category: true,
            pairA: { include: { athlete1: true, athlete2: true } },
            pairB: { include: { athlete1: true, athlete2: true } },
          },
          take: 1,
        },
      },
    });

    // Format court data with elapsed time
    const now = new Date();
    const courtCards = courts.map((court) => {
      const activeMatch = court.matches[0] || null;
      let elapsedMinutes = 0;
      if (activeMatch && activeMatch.startedAt) {
        elapsedMinutes = Math.max(
          0,
          Math.floor((now.getTime() - new Date(activeMatch.startedAt).getTime()) / 60000)
        );
      }

      return {
        id: court.id,
        name: court.name,
        type: court.type,
        status: court.status,
        displayOrder: court.displayOrder,
        activeMatch: activeMatch
          ? {
              id: activeMatch.id,
              categoryName: activeMatch.category.name,
              phase: activeMatch.phase,
              groupId: activeMatch.groupId,
              round: activeMatch.round,
              status: activeMatch.status,
              scoreA: activeMatch.scoreA,
              scoreB: activeMatch.scoreB,
              startedAt: activeMatch.startedAt,
              elapsedMinutes,
              pairA: activeMatch.pairA
                ? {
                    id: activeMatch.pairA.id,
                    a1: activeMatch.pairA.athlete1.fullName,
                    a2: activeMatch.pairA.athlete2.fullName,
                  }
                : null,
              pairB: activeMatch.pairB
                ? {
                    id: activeMatch.pairB.id,
                    a1: activeMatch.pairB.athlete1.fullName,
                    a2: activeMatch.pairB.athlete2.fullName,
                  }
                : null,
            }
          : null,
      };
    });

    // Fila de Espera / Próximos Jogos (WAITING_COURT or top SCHEDULED with pairs assigned)
    const queueMatches = await prisma.match.findMany({
      where: {
        category: { tournamentId },
        status: { in: ["WAITING_COURT", "SCHEDULED"] },
        pairAId: { not: null },
        pairBId: { not: null },
        courtId: null,
      },
      include: {
        category: true,
        pairA: { include: { athlete1: true, athlete2: true } },
        pairB: { include: { athlete1: true, athlete2: true } },
      },
      orderBy: [
        { status: "asc" }, // WAITING_COURT first
        { scheduledTime: "asc" },
      ],
      take: 8,
    });

    const waitingQueue = queueMatches.map((m, index) => {
      return {
        queuePosition: index + 1,
        id: m.id,
        categoryName: m.category.name,
        phase: m.phase,
        groupId: m.groupId,
        status: m.status,
        scheduledTime: m.scheduledTime,
        pairA: m.pairA
          ? {
              id: m.pairA.id,
              name: `${m.pairA.athlete1.fullName.split(" ")[0]} / ${m.pairA.athlete2.fullName.split(" ")[0]}`,
              full: `${m.pairA.athlete1.fullName} & ${m.pairA.athlete2.fullName}`,
            }
          : null,
        pairB: m.pairB
          ? {
              id: m.pairB.id,
              name: `${m.pairB.athlete1.fullName.split(" ")[0]} / ${m.pairB.athlete2.fullName.split(" ")[0]}`,
              full: `${m.pairB.athlete1.fullName} & ${m.pairB.athlete2.fullName}`,
            }
          : null,
      };
    });

    const activeLiveCount = courtCards.filter(
      (c) => c.activeMatch && c.activeMatch.status === "LIVE"
    ).length;

    return NextResponse.json({
      tournament,
      courts: courtCards,
      waitingQueue,
      stats: {
        activeLiveCount,
        totalCourts: courts.length,
        freeCourts: courtCards.filter((c) => !c.activeMatch).length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro na API Telao:", error);
    return NextResponse.json({ error: "Erro ao carregar dados do telão" }, { status: 500 });
  }
}
