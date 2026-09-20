import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      tournamentId,
      name,
      type,
      maxPairs,
      format,
      groupCount,
      advancePerGroup,
      bracketSize,
      matchRule,
    } = body;

    if (!tournamentId || !name) {
      return NextResponse.json(
        { error: "Dados obrigatórios faltando" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        tournamentId,
        name,
        type: type || "DUPLA_MASC",
        maxPairs: parseInt(maxPairs) || 16,
        format: format || "GROUPS_AND_KNOCKOUT",
        groupCount: parseInt(groupCount) || 4,
        advancePerGroup: parseInt(advancePerGroup) || 2,
        bracketSize: parseInt(bracketSize) || 8,
        matchRule: matchRule || "ONE_STANDARD_SET_6",
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao excluir categoria" },
      { status: 500 }
    );
  }
}
