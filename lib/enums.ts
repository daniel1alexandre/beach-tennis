export const TournamentStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export const CategoryType = {
  DUPLA_MASC: "DUPLA_MASC",
  DUPLA_FEM: "DUPLA_FEM",
  DUPLA_MISTA: "DUPLA_MISTA",
  SIMPLES: "SIMPLES",
} as const;

export const CategoryTypeLabels: Record<string, string> = {
  DUPLA_MASC: "Dupla Masculina",
  DUPLA_FEM: "Dupla Feminina",
  DUPLA_MISTA: "Dupla Mista",
  SIMPLES: "Simples",
};

export const CategoryFormat = {
  GROUPS_AND_KNOCKOUT: "GROUPS_AND_KNOCKOUT",
  KNOCKOUT_ONLY: "KNOCKOUT_ONLY",
  ROUND_ROBIN_ONLY: "ROUND_ROBIN_ONLY",
} as const;

export const CategoryFormatLabels: Record<string, string> = {
  GROUPS_AND_KNOCKOUT: "Fase de Grupos + Mata-Mata",
  KNOCKOUT_ONLY: "Mata-Mata Direto",
  ROUND_ROBIN_ONLY: "Pontos Corridos (Todos contra Todos)",
};

export const MatchRule = {
  ONE_PRO_SET_9: "ONE_PRO_SET_9",
  ONE_STANDARD_SET_6: "ONE_STANDARD_SET_6",
  BEST_OF_3_SETS: "BEST_OF_3_SETS",
  SUPER_TIEBREAK_10: "SUPER_TIEBREAK_10",
} as const;

export const MatchRuleLabels: Record<string, string> = {
  ONE_PRO_SET_9: "1 Pro Set até 9 games",
  ONE_STANDARD_SET_6: "1 Set Padrão até 6 games",
  BEST_OF_3_SETS: "Melhor de 3 Sets (até 6 games)",
  SUPER_TIEBREAK_10: "Super Tiebreak até 10 pontos",
};

export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const;

export const PairStatus = {
  CONFIRMED: "CONFIRMED",
  WAITLIST: "WAITLIST",
  CANCELED: "CANCELED",
} as const;

export const CourtType = {
  SAND: "SAND",
  QUICK: "QUICK",
  INDOOR_SAND: "INDOOR_SAND",
} as const;

export const CourtTypeLabels: Record<string, string> = {
  SAND: "Areia Externa",
  QUICK: "Piso Rápido",
  INDOOR_SAND: "Areia Coberta",
};

export const CourtStatus = {
  AVAILABLE: "AVAILABLE",
  OCCUPIED: "OCCUPIED",
  MAINTENANCE: "MAINTENANCE",
  INACTIVE: "INACTIVE",
} as const;

export const CourtStatusLabels: Record<string, string> = {
  AVAILABLE: "Disponível",
  OCCUPIED: "Em Jogo",
  MAINTENANCE: "Manutenção",
  INACTIVE: "Inativa",
};

export const MatchPhase = {
  GROUP_STAGE: "GROUP_STAGE",
  ROUND_OF_32: "ROUND_OF_32",
  ROUND_OF_16: "ROUND_OF_16",
  QUARTERFINALS: "QUARTERFINALS",
  SEMIFINALS: "SEMIFINALS",
  FINAL: "FINAL",
  THIRD_PLACE: "THIRD_PLACE",
} as const;

export const MatchPhaseLabels: Record<string, string> = {
  GROUP_STAGE: "Fase de Grupos",
  ROUND_OF_32: "16avos de Final",
  ROUND_OF_16: "Oitavas de Final",
  QUARTERFINALS: "Quartas de Final",
  SEMIFINALS: "Semifinal",
  FINAL: "Grande Final",
  THIRD_PLACE: "Disputa de 3º Lugar",
};

export const MatchStatus = {
  SCHEDULED: "SCHEDULED",
  WAITING_COURT: "WAITING_COURT",
  WARMUP: "WARMUP",
  LIVE: "LIVE",
  FINISHED: "FINISHED",
  WALKOVER_A: "WALKOVER_A",
  WALKOVER_B: "WALKOVER_B",
  CANCELED: "CANCELED",
} as const;

export const MatchStatusLabels: Record<string, string> = {
  SCHEDULED: "Agendado",
  WAITING_COURT: "Aguardando Quadra",
  WARMUP: "Aquecimento",
  LIVE: "Ao Vivo",
  FINISHED: "Finalizado",
  WALKOVER_A: "W.O. (Vitória A)",
  WALKOVER_B: "W.O. (Vitória B)",
  CANCELED: "Cancelado",
};
