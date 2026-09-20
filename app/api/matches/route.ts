import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const tournamentId = searchParams.get("tournamentId");

  try {
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (tournamentId) where.category = { tournamentId };

    const matches = await prisma.match.findMany({
      where,
      include: {
        category: true,
        court: true,
        pairA: { include: { athlete1: true, athlete2: true } },
        pairB: { include: { athlete1: true, athlete2: true } },
        winnerPair: { include: { athlete1: true, athlete2: true } },
      },
      orderBy: [{ phase: "asc" }, { scheduledTime: "asc" }, { round: "asc" }],
    });

    return NextResponse.json(matches);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar partidas" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { matchId, scoreA, scoreB, setsDetail, status, courtId, winnerPairId } = body;

    if (!matchId) {
      return NextResponse.json({ error: "matchId é obrigatório" }, { status: 400 });
    }

    const currentMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: { court: true, nextMatch: true },
    });

    if (!currentMatch) {
      return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 });
    }

    const updateData: any = {};
    if (scoreA !== undefined) updateData.scoreA = scoreA;
    if (scoreB !== undefined) updateData.scoreB = scoreB;
    if (setsDetail !== undefined) {
      updateData.setsDetail = typeof setsDetail === "string" ? setsDetail : JSON.stringify(setsDetail);
    }
    if (courtId !== undefined) updateData.courtId = courtId || null;

    if (status) {
      updateData.status = status;
      if (status === "LIVE" && !currentMatch.startedAt) {
        updateData.startedAt = new Date();
      }
      if (status === "FINISHED" || status.startsWith("WALKOVER")) {
        updateData.finishedAt = new Date();
      }
    }

    // Determine winner if finished or walkover
    let determinedWinner = winnerPairId || currentMatch.winnerPairId;
    if (status === "WALKOVER_A") {
      determinedWinner = currentMatch.pairAId;
      updateData.scoreA = 6;
      updateData.scoreB = 0;
      updateData.setsDetail = JSON.stringify([{ set: 1, gamesA: 6, gamesB: 0 }]);
    } else if (status === "WALKOVER_B") {
      determinedWinner = currentMatch.pairBId;
      updateData.scoreA = 0;
      updateData.scoreB = 6;
      updateData.setsDetail = JSON.stringify([{ set: 1, gamesA: 0, gamesB: 6 }]);
    } else if (status === "FINISHED" && !determinedWinner) {
      if ((scoreA ?? currentMatch.scoreA) > (scoreB ?? currentMatch.scoreB)) {
        determinedWinner = currentMatch.pairAId;
      } else if ((scoreB ?? currentMatch.scoreB) > (scoreA ?? currentMatch.scoreA)) {
        determinedWinner = currentMatch.pairBId;
      }
    }

    if (determinedWinner) {
      updateData.winnerPairId = determinedWinner;
    }

    // Execute atomic update
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: updateData,
      include: {
        category: true,
        court: true,
        pairA: { include: { athlete1: true, athlete2: true } },
        pairB: { include: { athlete1: true, athlete2: true } },
      },
    });

    // Court status handling
    // If match is LIVE or WARMUP, mark court as OCCUPIED
    if ((status === "LIVE" || status === "WARMUP") && (courtId || currentMatch.courtId)) {
      const activeCourtId = courtId || currentMatch.courtId;
      if (activeCourtId) {
        await prisma.court.update({
          where: { id: activeCourtId },
          data: { status: "OCCUPIED" },
        });
      }
    }

    // If match is FINISHED, W.O., CANCELED, WAITING_COURT, or SCHEDULED, free the court if no other active match is on it
    if (
      status === "FINISHED" ||
      status?.startsWith("WALKOVER") ||
      status === "CANCELED" ||
      status === "WAITING_COURT" ||
      status === "SCHEDULED" ||
      courtId === null
    ) {
      const freedCourtId = currentMatch.courtId;
      if (freedCourtId) {
        const otherLive = await prisma.match.findFirst({
          where: {
            courtId: freedCourtId,
            status: { in: ["LIVE", "WARMUP"] },
            id: { not: matchId },
          },
        });
        if (!otherLive) {
          await prisma.court.update({
            where: { id: freedCourtId },
            data: { status: "AVAILABLE" },
          });
        }
      }
    }

    // RF-022: Propagate winner to nextMatch in bracket
    if (
      (status === "FINISHED" || status?.startsWith("WALKOVER")) &&
      determinedWinner &&
      currentMatch.nextMatchId
    ) {
      const nextMatchSlot = currentMatch.nextMatchSlot;
      const nextMatchUpdate: any = {};
      if (nextMatchSlot === "PAIR_A") {
        nextMatchUpdate.pairAId = determinedWinner;
      } else if (nextMatchSlot === "PAIR_B") {
        nextMatchUpdate.pairBId = determinedWinner;
      }

      if (Object.keys(nextMatchUpdate).length > 0) {
        await prisma.match.update({
          where: { id: currentMatch.nextMatchId },
          data: nextMatchUpdate,
        });
      }
    }

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error("Erro ao atualizar partida:", error);
    return NextResponse.json({ error: "Erro ao atualizar partida" }, { status: 500 });
  }
}
