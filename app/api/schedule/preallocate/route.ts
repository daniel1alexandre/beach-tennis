import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tournamentId, categoryId } = body;

    if (!tournamentId) {
      return NextResponse.json({ error: "tournamentId é obrigatório" }, { status: 400 });
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        settings: true,
        courts: {
          where: { status: { not: "INACTIVE" } },
          orderBy: { displayOrder: "asc" },
        },
        categories: {
          where: categoryId ? { id: categoryId } : undefined,
          include: {
            matches: {
              where: {
                status: { notIn: ["FINISHED", "CANCELED"] },
              },
              include: {
                pairA: { include: { athlete1: true, athlete2: true } },
                pairB: { include: { athlete1: true, athlete2: true } },
              },
              orderBy: [
                { phase: "asc" },
                { round: "asc" },
                { id: "asc" },
              ],
            },
          },
        },
      },
    });

    if (!tournament || tournament.courts.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma quadra ativa cadastrada no torneio." },
        { status: 400 }
      );
    }

    const courts = tournament.courts;
    const matchDurationMin = tournament.settings?.avgMatchDurationMinutes || 45;
    const intervalMin = tournament.settings?.intervalBetweenMatchesMinutes || 5;
    const slotStepMin = matchDurationMin + intervalMin; // e.g. 50 min

    const startDate = new Date(tournament.startDate);
    let startHour = 8;
    let startMin = 0;

    // Matches to allocate
    const matchesToAllocate = tournament.categories.flatMap((c) => c.matches);
    if (matchesToAllocate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma partida pendente de alocação encontrada.",
        allocatedCount: 0,
      });
    }

    let courtIndex = 0;
    let currentSlotOffsetMinutes = 0;
    let allocatedCount = 0;

    for (const match of matchesToAllocate) {
      const court = courts[courtIndex];
      const matchTime = new Date(startDate);
      matchTime.setHours(startHour, startMin + currentSlotOffsetMinutes, 0, 0);

      await prisma.match.update({
        where: { id: match.id },
        data: {
          courtId: court.id,
          scheduledTime: matchTime,
          status: match.status === "WAITING_COURT" ? "SCHEDULED" : match.status,
        },
      });

      allocatedCount++;
      courtIndex++;

      if (courtIndex >= courts.length) {
        courtIndex = 0;
        currentSlotOffsetMinutes += slotStepMin;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${allocatedCount} partidas foram pré-alocadas na grade horária com sucesso!`,
      allocatedCount,
    });
  } catch (error) {
    console.error("Erro na pré-alocação:", error);
    return NextResponse.json({ error: "Erro ao pré-alocar partidas" }, { status: 500 });
  }
}
