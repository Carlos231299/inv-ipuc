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

// Ministerios de la iglesia local con su enfoque (módulo Líderes)
export const MINISTERIOS: { nombre: string; enfoque: string }[] = [
  { nombre: "Jóvenes (Conquistadores)", enfoque: "Actividades espirituales y sociales de la juventud" },
  { nombre: "Damas (Dorcas)", enfoque: "Trabajo con las mujeres de la congregación" },
  { nombre: "Caballeros", enfoque: "Varones de la iglesia" },
  { nombre: "Escuela Dominical", enfoque: "Enseñanza bíblica de niños y nuevos creyentes" },
  { nombre: "Misiones y Evangelismo", enfoque: "Predicación en nuevos sectores y alcance social" },
  { nombre: "Alabanza", enfoque: "Grupo de músicos y cantores para los cultos" },
];
