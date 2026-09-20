import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Batch Import mode (RF-007)
    if (body.action === "batch") {
      const { tournamentId, rows } = body;
      // rows: Array of { athlete1Name, athlete1Phone, athlete2Name, athlete2Phone, categoryName, seedRanking }
      let createdCount = 0;
      const errors: string[] = [];

      for (const row of rows) {
        if (!row.athlete1Name || !row.categoryName) continue;

        // Find or create category
        let category = await prisma.category.findFirst({
          where: { tournamentId, name: { contains: row.categoryName } },
        });

        if (!category) {
          errors.push(`Categoria "${row.categoryName}" não encontrada`);
          continue;
        }

        // Find or create Athlete 1
        let a1 = await prisma.athlete.findFirst({
          where: { fullName: { equals: row.athlete1Name } },
        });
        if (!a1) {
          a1 = await prisma.athlete.create({
            data: {
              fullName: row.athlete1Name,
              phone: row.athlete1Phone || "(11) 99999-0000",
            },
          });
        }

        // Find or create Athlete 2
        let a2Id = a1.id;
        if (row.athlete2Name) {
          let a2 = await prisma.athlete.findFirst({
            where: { fullName: { equals: row.athlete2Name } },
          });
          if (!a2) {
            a2 = await prisma.athlete.create({
              data: {
                fullName: row.athlete2Name,
                phone: row.athlete2Phone || "(11) 99999-0000",
              },
            });
          }
          a2Id = a2.id;
        }

        // RN-001 Check
        const existingInCat = await prisma.pair.findFirst({
          where: {
            categoryId: category.id,
            OR: [
              { athlete1Id: a1.id },
              { athlete2Id: a1.id },
              { athlete1Id: a2Id },
              { athlete2Id: a2Id },
            ],
          },
        });

        if (existingInCat) {
          errors.push(
            `Atleta já inscrito nesta categoria (${row.athlete1Name} ou ${row.athlete2Name})`
          );
          continue;
        }

        // Check waitlist limit (RF-008)
        const currentCount = await prisma.pair.count({
          where: { categoryId: category.id, status: "CONFIRMED" },
        });
        const status = currentCount >= category.maxPairs ? "WAITLIST" : "CONFIRMED";

        await prisma.pair.create({
          data: {
            categoryId: category.id,
            athlete1Id: a1.id,
            athlete2Id: a2Id,
            seedRanking: row.seedRanking ? parseInt(row.seedRanking) : null,
            status,
          },
        });

        createdCount++;
      }

      return NextResponse.json({ success: true, createdCount, errors });
    }

    // Single pair creation
    const { categoryId, athlete1Id, athlete2Id, seedRanking } = body;

    if (!categoryId || !athlete1Id || !athlete2Id) {
      return NextResponse.json(
        { error: "Categoria e ambos os atletas são obrigatórios" },
        { status: 400 }
      );
    }

    if (athlete1Id === athlete2Id) {
      return NextResponse.json(
        { error: "Selecione dois atletas distintos para formar a dupla" },
        { status: 400 }
      );
    }

    // RN-001: Unicidade de inscrição na mesma categoria
    const conflict = await prisma.pair.findFirst({
      where: {
        categoryId,
        OR: [
          { athlete1Id: athlete1Id },
          { athlete2Id: athlete1Id },
          { athlete1Id: athlete2Id },
          { athlete2Id: athlete2Id },
        ],
      },
      include: { athlete1: true, athlete2: true },
    });

    if (conflict) {
      return NextResponse.json(
        {
          error:
            "Regra de Negócio (RN-001): Um dos atletas já está inscrito em outra dupla nesta mesma categoria.",
        },
        { status: 400 }
      );
    }

    // Check category limit for Waitlist (RF-008)
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { pairs: { where: { status: "CONFIRMED" } } } } },
    });

    const isFull = category ? category._count.pairs >= category.maxPairs : false;
    const pairStatus = isFull ? "WAITLIST" : "CONFIRMED";

    const pair = await prisma.pair.create({
      data: {
        categoryId,
        athlete1Id,
        athlete2Id,
        seedRanking: seedRanking ? parseInt(seedRanking) : null,
        status: pairStatus,
      },
      include: { athlete1: true, athlete2: true },
    });

    return NextResponse.json({
      pair,
      isWaitlist: isFull,
      message: isFull
        ? "Vagas esgotadas! A dupla foi direcionada automaticamente para a Lista de Espera (Waitlist)."
        : "Dupla confirmada com sucesso!",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar dupla" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await prisma.pair.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao remover dupla" }, { status: 500 });
  }
}
