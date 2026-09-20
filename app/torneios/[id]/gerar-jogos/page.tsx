import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentNav from "@/components/TournamentNav";
import GenerateGamesClient from "./GenerateGamesClient";

export const dynamic = "force-dynamic";

export default async function GenerateGamesPage({
  params,
}: {
  params: { id: string };
}) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      courts: { orderBy: { displayOrder: "asc" } },
      categories: {
        include: {
          pairs: {
            where: { status: "CONFIRMED" },
            include: { athlete1: true, athlete2: true },
            orderBy: [{ seedRanking: "asc" }],
          },
          matches: {
            include: {
              court: true,
              pairA: { include: { athlete1: true, athlete2: true } },
              pairB: { include: { athlete1: true, athlete2: true } },
              winnerPair: { include: { athlete1: true, athlete2: true } },
            },
            orderBy: [{ phase: "asc" }, { round: "asc" }, { scheduledTime: "asc" }],
          },
        },
      },
    },
  });

  if (!tournament) notFound();

  return (
    <div className="min-h-screen bg-[#090E0B] text-slate-100 flex flex-col">
      <TournamentNav
        tournamentId={tournament.id}
        tournamentName={tournament.name}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <GenerateGamesClient
          tournamentId={tournament.id}
          categories={tournament.categories}
        />
      </main>
    </div>
  );
}
