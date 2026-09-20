import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  try {
    const athletes = await prisma.athlete.findMany({
      where: q
        ? {
            OR: [
              { fullName: { contains: q } },
              { email: { contains: q } },
              { club: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { fullName: "asc" },
      take: 50,
    });

    return NextResponse.json(athletes);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar atletas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, phone, email, gender, club, birthDate } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ error: "Nome e Telefone são obrigatórios" }, { status: 400 });
    }

    const athlete = await prisma.athlete.create({
      data: {
        fullName,
        phone,
        email: email || null,
        gender: gender || "MALE",
        club: club || null,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    });

    return NextResponse.json(athlete);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar atleta" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, fullName, phone, email, gender, club, birthDate } = body;

    if (!id || !fullName) {
      return NextResponse.json(
        { error: "ID e Nome Completo são obrigatórios" },
        { status: 400 }
      );
    }

    const updated = await prisma.athlete.update({
      where: { id },
      data: {
        fullName,
        phone: phone || "",
        email: email || null,
        gender: gender || "MALE",
        club: club || null,
        birthDate: birthDate ? new Date(birthDate) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar informações do atleta" },
      { status: 500 }
    );
  }
}

