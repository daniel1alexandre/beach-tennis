import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentNav from "@/components/TournamentNav";
import ConfigClient from "./ConfigClient";

export const dynamic = "force-dynamic";

export default async function ConfigPage({
  params,
}: {
  params: { id: string };
}) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      settings: true,
      courts: { orderBy: { displayOrder: "asc" } },
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
        <ConfigClient tournament={tournament} />
      </main>
    </div>
  );
}
