import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        categories: true,
        courts: true,
        settings: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(tournaments);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar torneios" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tournament = await prisma.tournament.create({
      data: {
        name: body.name,
        location: body.location || "Arena Viva Beach Club",
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        organizer: body.organizer || "Daniel Baumann / Viva By Baumann",
        notes: body.notes || "",
        status: "ACTIVE",
        settings: {
          create: {
            avgMatchDurationMinutes: 45,
            warmupDurationMinutes: 5,
            intervalBetweenMatchesMinutes: 5,
            restBetweenMatchesMinutes: 30,
            dailyTimeWindows: JSON.stringify([
              { date: body.startDate.split("T")[0], startTime: "08:00", endTime: "22:00" },
            ]),
          },
        },
        courts: {
          create: [
            { name: "Quadra 1 (Principal)", type: "SAND", status: "AVAILABLE", displayOrder: 1 },
            { name: "Quadra 2", type: "SAND", status: "AVAILABLE", displayOrder: 2 },
            { name: "Quadra 3", type: "SAND", status: "AVAILABLE", displayOrder: 3 },
            { name: "Quadra 4", type: "SAND", status: "AVAILABLE", displayOrder: 4 },
          ],
        },
      },
    });
    return NextResponse.json(tournament);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar torneio" }, { status: 500 });
  }
}
