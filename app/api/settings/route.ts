import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      tournamentId,
      avgMatchDurationMinutes,
      warmupDurationMinutes,
      intervalBetweenMatchesMinutes,
      restBetweenMatchesMinutes,
      dailyTimeWindows,
    } = body;

    if (!tournamentId) {
      return NextResponse.json({ error: "tournamentId é obrigatório" }, { status: 400 });
    }

    const settings = await prisma.tournamentSettings.upsert({
      where: { tournamentId },
      update: {
        avgMatchDurationMinutes: parseInt(avgMatchDurationMinutes) || 45,
        warmupDurationMinutes: parseInt(warmupDurationMinutes) || 5,
        intervalBetweenMatchesMinutes: parseInt(intervalBetweenMatchesMinutes) || 5,
        restBetweenMatchesMinutes: parseInt(restBetweenMatchesMinutes) || 30,
        dailyTimeWindows: typeof dailyTimeWindows === "string" ? dailyTimeWindows : JSON.stringify(dailyTimeWindows),
      },
      create: {
        tournamentId,
        avgMatchDurationMinutes: parseInt(avgMatchDurationMinutes) || 45,
        warmupDurationMinutes: parseInt(warmupDurationMinutes) || 5,
        intervalBetweenMatchesMinutes: parseInt(intervalBetweenMatchesMinutes) || 5,
        restBetweenMatchesMinutes: parseInt(restBetweenMatchesMinutes) || 30,
        dailyTimeWindows: typeof dailyTimeWindows === "string" ? dailyTimeWindows : JSON.stringify(dailyTimeWindows),
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 });
  }
}
