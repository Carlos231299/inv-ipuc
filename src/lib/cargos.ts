// Cargos Nivel Local (Junta Local, Comités y Líderes de Ministerios)
export const CARGOS: { grupo: string; cargos: string[] }[] = [
  { grupo: "Pastoral", cargos: ["Pastor"] },
  { grupo: "Junta Local", cargos: ["Miembro de Junta Local", "Secretario local", "Tesorero local"] },
  {
    grupo: "Directivas de Comités",
    cargos: ["Presidente / Director", "Vicepresidente", "Secretario", "Tesorero", "Vocal", "Líder de Música"],
  },
  {
    grupo: "Líderes de Ministerios",
    cargos: [
      "Líder de Jóvenes (Conquistadores)",
      "Líder de Damas (Dorcas)",
      "Líder de Caballeros",
      "Líder de Escuela Dominical",
      "Líder de Misiones y Evangelismo",
      "Líder de Alabanza",
    ],
  },
];
export const CARGOS_TODOS = CARGOS.flatMap((g) => g.cargos);
