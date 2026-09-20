import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentNav from "@/components/TournamentNav";
import AthletesClient from "./AthletesClient";

export const dynamic = "force-dynamic";

export default async function AthletesPage({
  params,
}: {
  params: { id: string };
}) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      categories: {
        include: {
          pairs: {
            include: { athlete1: true, athlete2: true },
            orderBy: [{ status: "asc" }, { seedRanking: "asc" }],
          },
        },
      },
    },
  });

  if (!tournament) notFound();

  const allAthletes = await prisma.athlete.findMany({
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#090E0B] text-slate-100 flex flex-col">
      <TournamentNav
        tournamentId={tournament.id}
        tournamentName={tournament.name}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <AthletesClient
          tournamentId={tournament.id}
          categories={tournament.categories}
          initialAthletes={allAthletes}
        />
      </main>
    </div>
  );
}
