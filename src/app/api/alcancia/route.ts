import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/auth";
import { db, totalRecogido } from "@/lib/db";

export async function GET() {
  if (!(await sessionUser())) return NextResponse.json({ error: "no auth" }, { status: 401 });
  const lista = db().prepare(
    `SELECT i.id, i.nombre, COALESCE(a.dio,0) AS dio, COALESCE(a.monto,0) AS monto, COALESCE(a.sellada,0) AS sellada
     FROM integrantes i LEFT JOIN alcancia a ON a.integrante_id=i.id ORDER BY i.nombre`).all();
  const l = lista as { dio: number }[];
  return NextResponse.json({
    lista, total: totalRecogido(),
    dieron: l.filter((x) => x.dio).length, pendientes: l.filter((x) => !x.dio).length,
  });
}

export async function POST(req: Request) {
  if (!(await sessionUser())) return NextResponse.json({ error: "no auth" }, { status: 401 });
  const b = await req.json();
  const d = db();
  const ex = d.prepare("SELECT id FROM alcancia WHERE integrante_id=?").get(Number(b.integrante_id));
  if (ex) d.prepare("UPDATE alcancia SET dio=?, monto=?, sellada=? WHERE integrante_id=?")
    .run(b.dio ? 1 : 0, Number(b.monto) || 0, b.sellada ? 1 : 0, Number(b.integrante_id));
  else d.prepare("INSERT INTO alcancia (integrante_id, dio, monto, sellada) VALUES (?,?,?,?)")
    .run(Number(b.integrante_id), b.dio ? 1 : 0, Number(b.monto) || 0, b.sellada ? 1 : 0);
  return NextResponse.json({ ok: true, total: totalRecogido() });
}
