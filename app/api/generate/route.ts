import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  distributePairsIntoGroups,
  generateRoundRobinMatches,
  calculateGroupStandings,
  calculateCBTGroupCount,
} from "@/lib/tournament-engine/groups";
import {
  buildKnockoutBracket,
  QualifiedTeam,
} from "@/lib/tournament-engine/brackets";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { categoryId, action, mode, forceWarningBypass } = body;
    // action: "GROUPS" or "BRACKET"

    if (!categoryId) {
      return NextResponse.json({ error: "categoryId é obrigatório" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        tournament: { include: { courts: true } },
        pairs: {
          where: { status: "CONFIRMED" },
          include: { athlete1: true, athlete2: true },
        },
        matches: true,
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    if (action === "CLEAR_RESULTS") {
      // Zerar e limpar todos os placares e resultados da categoria especificada
      const updated = await prisma.match.updateMany({
        where: { categoryId },
        data: {
          scoreA: 0,
          scoreB: 0,
          winnerPairId: null,
          status: "SCHEDULED",
          setsDetail: "[]",
          startedAt: null,
          finishedAt: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Todos os resultados da categoria foram zerados com sucesso (${updated.count} partidas limpas).`,
      });
    }

    // RN-006: Checagem de integridade de regeração
    const activeOrFinishedMatches = category.matches.filter(
      (m) =>
        m.status === "LIVE" ||
        m.status === "FINISHED" ||
        m.status.startsWith("WALKOVER")
    );

    if (activeOrFinishedMatches.length > 0 && !forceWarningBypass) {
      return NextResponse.json(
        {
          error:
            "Regra RN-006: Existem partidas já em andamento (AO VIVO) ou finalizadas nesta fase. Para regerar a chave, resete os resultados primeiro ou confirme o bypass com advertência expressa.",
          requiresWarningBypass: true,
        },
        { status: 400 }
      );
    }

    if (action === "GROUPS") {
      if (category.pairs.length < 2) {
        return NextResponse.json(
          { error: "É necessário ao menos 2 duplas confirmadas para gerar grupos" },
          { status: 400 }
        );
      }

      // Cálculo oficial CBT: quantidade de grupos conforme a quantidade de duplas inscritas
      const cbtRule = calculateCBTGroupCount(category.pairs.length);
      const effectiveGroupCount = cbtRule.groupCount;

      // Sincroniza os parâmetros de grupo e mata-mata na categoria
      await prisma.category.update({
        where: { id: categoryId },
        data: {
          groupCount: effectiveGroupCount,
          advancePerGroup: cbtRule.advancePerGroup,
          bracketSize: cbtRule.bracketSize,
        },
      });

      // Delete existing group stage matches for this category
      await prisma.match.deleteMany({
        where: {
          categoryId,
          phase: "GROUP_STAGE",
        },
      });

      // 1. Distribute into groups conforme regras oficiais da CBT
      const distributed = distributePairsIntoGroups(
        category.pairs as any,
        effectiveGroupCount,
        mode === "RANDOM" ? "RANDOM" : "SERPENTINE"
      );

      // 2. Generate round-robin matches
      const newMatchesData: any[] = [];
      const startTime = new Date(category.tournament.startDate);

      for (let gIdx = 0; gIdx < distributed.length; gIdx++) {
        const group = distributed[gIdx];
        const groupMatches = generateRoundRobinMatches(
          group.pairs as any,
          group.groupName
        );

        for (let mIdx = 0; mIdx < groupMatches.length; mIdx++) {
          const gm = groupMatches[mIdx];
          // Scheduled time estimate (spaced by 45 mins)
          const matchTime = new Date(
            startTime.getTime() + (gIdx * 3 + mIdx) * 45 * 60 * 1000
          );

          newMatchesData.push({
            categoryId,
            phase: "GROUP_STAGE",
            groupId: gm.groupId,
            round: gm.round,
            pairAId: gm.pairAId,
            pairBId: gm.pairBId,
            status: "SCHEDULED",
            scheduledTime: matchTime,
          });
        }
      }

      await prisma.match.createMany({
        data: newMatchesData,
      });

      return NextResponse.json({
        success: true,
        message: `${newMatchesData.length} confrontos de fase de grupos gerados com sucesso!`,
      });
    }

    if (action === "BRACKET") {
      // RN-005: Bloqueio de Geração de Bracket antes da conclusão integral da fase de grupos
      const groupMatches = category.matches.filter(
        (m) => m.phase === "GROUP_STAGE"
      );
      const pendingGroupMatches = groupMatches.filter(
        (m) => m.status !== "FINISHED" && !m.status.startsWith("WALKOVER")
      );

      if (
        groupMatches.length > 0 &&
        pendingGroupMatches.length > 0 &&
        !forceWarningBypass
      ) {
        return NextResponse.json(
          {
            error: `Regra RN-005: A chave mata-mata só pode ser gerada após a conclusão de todos os jogos de grupo (${pendingGroupMatches.length} jogos ainda pendentes).`,
            requiresWarningBypass: true,
          },
          { status: 400 }
        );
      }

      // Calculate qualifiers from groups
      const qualifiers: QualifiedTeam[] = [];
      const groupNames = Array.from(
        new Set(groupMatches.map((m) => m.groupId).filter(Boolean))
      ) as string[];

      for (const gName of groupNames) {
        // Pairs in this group
        const pairsInGroup = category.pairs.filter((p) =>
          groupMatches.some(
            (m) =>
              m.groupId === gName && (m.pairAId === p.id || m.pairBId === p.id)
          )
        );

        const standings = calculateGroupStandings(
          pairsInGroup as any,
          groupMatches.filter((m) => m.groupId === gName),
          category.advancePerGroup
        );

        standings
          .filter((s) => s.qualified)
          .forEach((s) => {
            qualifiers.push({
              pairId: s.pairId,
              groupName: gName,
              positionInGroup: s.position,
              seedRanking: s.seed,
            });
          });
      }

      // Delete existing bracket matches
      await prisma.match.deleteMany({
        where: {
          categoryId,
          phase: { not: "GROUP_STAGE" },
        },
      });

      // Build bracket drafts
      const bracketDrafts = buildKnockoutBracket(
        qualifiers,
        category.bracketSize
      );

      // Create matches in DB and link nextMatchId
      const tempIdToDbId = new Map<string, string>();

      // We create from round 1 to final
      for (const draft of bracketDrafts) {
        const created = await prisma.match.create({
          data: {
            categoryId,
            phase: draft.phase,
            round: draft.round,
            positionInBracket: draft.positionInBracket,
            pairAId: draft.pairAId || null,
            pairBId: draft.pairBId || null,
            status: draft.pairAId && draft.pairBId ? "SCHEDULED" : "WAITING_COURT",
            scheduledTime: new Date(
              category.tournament.startDate.getTime() +
                (draft.round * 60 + draft.positionInBracket * 45) * 60 * 1000
            ),
          },
        });
        tempIdToDbId.set(draft.tempId, created.id);
      }

      // Update nextMatch links
      for (const draft of bracketDrafts) {
        if (draft.nextMatchTempId) {
          const currentDbId = tempIdToDbId.get(draft.tempId);
          const nextDbId = tempIdToDbId.get(draft.nextMatchTempId);
          if (currentDbId && nextDbId) {
            await prisma.match.update({
              where: { id: currentDbId },
              data: {
                nextMatchId: nextDbId,
                nextMatchSlot: draft.nextMatchSlot || null,
              },
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Chave mata-mata (${category.bracketSize} posições) gerada com sucesso!`,
      });
    }

    return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao processar chaveamento" }, { status: 500 });
  }
}
