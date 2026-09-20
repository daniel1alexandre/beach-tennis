import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournamentId");
  const format = searchParams.get("format") || "json";

  if (!tournamentId) {
    return NextResponse.json({ error: "tournamentId é obrigatório" }, { status: 400 });
  }

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        settings: true,
        courts: { orderBy: { displayOrder: "asc" } },
        categories: {
          include: {
            pairs: {
              include: { athlete1: true, athlete2: true },
            },
            matches: {
              include: {
                court: true,
                pairA: { include: { athlete1: true, athlete2: true } },
                pairB: { include: { athlete1: true, athlete2: true } },
                winnerPair: { include: { athlete1: true, athlete2: true } },
              },
              orderBy: [{ phase: "asc" }, { scheduledTime: "asc" }],
            },
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 });
    }

    if (format === "csv") {
      // Generate CSV of matches
      const rows = [
        "Categoria,Fase,Grupo,Rodada,Quadra,Horario,Dupla A,Placar A,Placar B,Dupla B,Status,Vencedor",
      ];

      for (const cat of tournament.categories) {
        for (const m of cat.matches) {
          const pairAName = m.pairA
            ? `${m.pairA.athlete1.fullName} / ${m.pairA.athlete2.fullName}`
            : "A definir";
          const pairBName = m.pairB
            ? `${m.pairB.athlete1.fullName} / ${m.pairB.athlete2.fullName}`
            : "A definir";
          const winnerName = m.winnerPair
            ? `${m.winnerPair.athlete1.fullName} / ${m.winnerPair.athlete2.fullName}`
            : "-";
          const courtName = m.court ? m.court.name : "A definir";
          const time = m.scheduledTime
            ? new Date(m.scheduledTime).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-";

          rows.push(
            `"${cat.name}","${m.phase}","${m.groupId || "-"}","${m.round}","${courtName}","${time}","${pairAName}","${m.scoreA}","${m.scoreB}","${pairBName}","${m.status}","${winnerName}"`
          );
        }
      }

      return new NextResponse(rows.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="torneio-${tournamentId}-partidas.csv"`,
        },
      });
    }

    // Default JSON backup
    return new NextResponse(JSON.stringify(tournament, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="backup-torneio-${tournament.name.toLowerCase().replace(/\s+/g, "-")}.json"`,
      },
    });
  } catch (error) {
    console.error("Erro no export:", error);
    return NextResponse.json({ error: "Erro ao exportar dados" }, { status: 500 });
  }
}
