import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/auth";
import { grupos, integrantes, rotacion, nombreGrupo } from "@/lib/db";

export async function GET() {
  if (!(await sessionUser())) return NextResponse.json({ error: "no auth" }, { status: 401 });
  const gs = grupos();
  const ms = integrantes();
  return NextResponse.json({
    grupos: gs.map((g) => ({ ...g, miembros: ms.filter((m) => m.grupo_id === g.id) })),
    sinGrupo: ms.filter((m) => m.grupo_id == null && m.estado === "ACTIVO"),
    rotacion: rotacion().map((r) => ({ ...r, grupo: nombreGrupo(r.grupo_id) })),
  });
}
