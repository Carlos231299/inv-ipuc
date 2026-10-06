// Etiquetas bonitas para UI y PDFs (la BD guarda el código, se muestra el texto)
export const ESTADO_EQUIPO: Record<string, string> = {
  EN_USO: "En uso",
  SIN_USO: "Sin uso",
  DAÑADO: "Dañado",
  MANTENIMIENTO: "Mantenimiento",
};

export const ESTADO_PERSONA: Record<string, string> = {
  ACTIVO: "Activo",
  ASISTENTE: "Asistente",
  DISPONIBLE: "Disponible",
  APARTADO: "Apartado",
  INACTIVO_SALUD: "Inactivo · salud",
};

export const eq = (v: string) => ESTADO_EQUIPO[v] ?? v;
export const ep = (v: string) => ESTADO_PERSONA[v] ?? v;

export const fmtCOP = (n: number) =>
  "$" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const HEADER_IGLESIA = "IPUC 19, Maicao — Altos del Parrantial";
