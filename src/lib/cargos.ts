// Cargos Nivel Local (Junta Local y Comités) + rol actual de música
export const CARGOS: { grupo: string; cargos: string[] }[] = [
  { grupo: "Pastoral", cargos: ["Pastor"] },
  { grupo: "Junta Local", cargos: ["Miembro de Junta Local", "Secretario local", "Tesorero local"] },
  {
    grupo: "Directivas de Comités",
    cargos: ["Presidente / Director", "Vicepresidente", "Secretario", "Tesorero", "Vocal", "Líder de Música"],
  },
];
export const CARGOS_TODOS = CARGOS.flatMap((g) => g.cargos);
