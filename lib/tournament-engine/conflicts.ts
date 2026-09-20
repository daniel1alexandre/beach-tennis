export interface AthleteConflictCheck {
  athleteId: string;
  athleteName: string;
  hasConflict: boolean;
  reason?: string;
  conflictingMatchId?: string;
  conflictingMatchTime?: Date;
}

/**
 * RN-002: Check if athletes in the pair have any other matches in the same timeslot
 * or within restBetweenMatchesMinutes.
 */
export function checkMatchTimeConflicts(
  targetMatch: {
    id?: string;
    pairA?: { athlete1Id: string; athlete2Id: string } | null;
    pairB?: { athlete1Id: string; athlete2Id: string } | null;
    scheduledTime: Date;
    estimatedDurationMinutes?: number;
  },
  existingMatches: Array<{
    id: string;
    scheduledTime: Date | null;
    pairA?: {
      athlete1Id: string;
      athlete2Id: string;
      athlete1?: { fullName: string };
      athlete2?: { fullName: string };
    } | null;
    pairB?: {
      athlete1Id: string;
      athlete2Id: string;
      athlete1?: { fullName: string };
      athlete2?: { fullName: string };
    } | null;
    status: string;
  }>,
  restMinutes: number = 30,
  durationMinutes: number = 45
): AthleteConflictCheck[] {
  const conflicts: AthleteConflictCheck[] = [];
  const targetAthletes = new Set<string>();

  if (targetMatch.pairA) {
    if (targetMatch.pairA.athlete1Id) targetAthletes.add(targetMatch.pairA.athlete1Id);
    if (targetMatch.pairA.athlete2Id) targetAthletes.add(targetMatch.pairA.athlete2Id);
  }
  if (targetMatch.pairB) {
    if (targetMatch.pairB.athlete1Id) targetAthletes.add(targetMatch.pairB.athlete1Id);
    if (targetMatch.pairB.athlete2Id) targetAthletes.add(targetMatch.pairB.athlete2Id);
  }

  if (targetAthletes.size === 0 || !targetMatch.scheduledTime) return [];

  const targetStart = new Date(targetMatch.scheduledTime).getTime();
  const targetEnd = targetStart + durationMinutes * 60 * 1000;
  const targetMinRestStart = targetStart - restMinutes * 60 * 1000;
  const targetMinRestEnd = targetEnd + restMinutes * 60 * 1000;

  for (const existing of existingMatches) {
    if (existing.id === targetMatch.id) continue;
    if (existing.status === "FINISHED" || existing.status === "CANCELED") continue;
    if (!existing.scheduledTime) continue;

    const existStart = new Date(existing.scheduledTime).getTime();
    const existEnd = existStart + durationMinutes * 60 * 1000;

    // Check time overlap or within rest window
    const overlapsOrInRestWindow =
      (existStart >= targetMinRestStart && existStart <= targetMinRestEnd) ||
      (existEnd >= targetMinRestStart && existEnd <= targetMinRestEnd) ||
      (existStart <= targetStart && existEnd >= targetEnd);

    if (overlapsOrInRestWindow) {
      const existingAthletes = [
        { id: existing.pairA?.athlete1Id, name: existing.pairA?.athlete1?.fullName || "Atleta" },
        { id: existing.pairA?.athlete2Id, name: existing.pairA?.athlete2?.fullName || "Atleta" },
        { id: existing.pairB?.athlete1Id, name: existing.pairB?.athlete1?.fullName || "Atleta" },
        { id: existing.pairB?.athlete2Id, name: existing.pairB?.athlete2?.fullName || "Atleta" },
      ];

      for (const ea of existingAthletes) {
        if (ea.id && targetAthletes.has(ea.id)) {
          conflicts.push({
            athleteId: ea.id,
            athleteName: ea.name,
            hasConflict: true,
            reason: `Conflito de descanso ou sobreposição com outro jogo às ${new Date(existing.scheduledTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
            conflictingMatchId: existing.id,
            conflictingMatchTime: new Date(existing.scheduledTime),
          });
        }
      }
    }
  }

  return conflicts;
}
