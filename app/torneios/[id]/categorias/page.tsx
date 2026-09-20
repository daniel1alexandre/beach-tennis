import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TournamentNav from "@/components/TournamentNav";
import CategoryManagerClient from "./CategoryManagerClient";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  params,
}: {
  params: { id: string };
}) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      categories: {
        include: {
          _count: { select: { pairs: true, matches: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!tournament) notFound();

  return (
    <div className="min-h-screen bg-[#060B12] text-slate-100 flex flex-col font-sans">
      <TournamentNav
        tournamentId={tournament.id}
        tournamentName={tournament.name}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <CategoryManagerClient
          tournamentId={tournament.id}
          initialCategories={tournament.categories}
        />
      </main>
    </div>
  );
}
