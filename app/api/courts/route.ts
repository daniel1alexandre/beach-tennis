import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tournamentId, name, type, status, displayOrder } = body;

    if (!tournamentId || !name) {
      return NextResponse.json({ error: "tournamentId e name são obrigatórios" }, { status: 400 });
    }

    const court = await prisma.court.create({
      data: {
        tournamentId,
        name,
        type: type || "SAND",
        status: status || "AVAILABLE",
        displayOrder: parseInt(displayOrder) || 1,
      },
    });

    return NextResponse.json(court);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar quadra" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { courtId, name, type, status, displayOrder } = body;

    if (!courtId) {
      return NextResponse.json({ error: "courtId é obrigatório" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (status) updateData.status = status;
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder);

    const court = await prisma.court.update({
      where: { id: courtId },
      data: updateData,
    });

    return NextResponse.json(court);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar quadra" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
    }

    await prisma.court.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao remover quadra" }, { status: 500 });
  }
}
