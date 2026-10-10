import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/auth";
import { db, nombreGrupo } from "@/lib/db";

async function ok() {
  return (await sessionUser()) ? null : NextResponse.json({ error: "no auth" }, { status: 401 });
}

export async function GET() {
  const n = await ok(); if (n) return n;
  const d = db();
  const rows = d.prepare(
    `SELECT i.*, a.dio, a.monto FROM integrantes i LEFT JOIN alcancia a ON a.integrante_id=i.id ORDER BY i.nombre`
  ).all() as Record<string, unknown>[];
  return NextResponse.json(rows.map((r) => ({ ...r, grupo: nombreGrupo(r.grupo_id as number | null) })));
}

export async function POST(req: Request) {
  const n = await ok(); if (n) return n;
  const b = await req.json();
  if (!b.nombre?.trim()) return NextResponse.json({ error: "nombre" }, { status: 400 });
  const d = db();
  const r = d.prepare(
    "INSERT INTO integrantes (nombre, estado, grupo_id, rol, telefono, fecha_ingreso, foto, observaciones, atributo) VALUES (?,?,?,?,?,?,?,?,?)"
  ).run(b.nombre.trim(), b.estado || "ACTIVO", b.grupo_id ?? null, b.rol || "",
    b.telefono || "", "2026", b.foto || null, b.observaciones || "", b.atributo || "");
  const id = Number(r.lastInsertRowid);
  d.prepare("INSERT INTO alcancia (integrante_id, dio, monto, fecha) VALUES (?,?,?,?)")
    .run(id, b.dio ? 1 : 0, Number(b.monto) || 0, b.dio ? "2026" : "");
  return NextResponse.json({ id });
}

export async function PUT(req: Request) {
  const n = await ok(); if (n) return n;
  const b = await req.json();
  const d = db();
  d.prepare("UPDATE integrantes SET nombre=?, estado=?, grupo_id=?, rol=?, telefono=?, foto=?, observaciones=?, atributo=? WHERE id=?")
    .run(b.nombre.trim(), b.estado, b.grupo_id ?? null, b.rol || "", b.telefono || "", b.foto || null, b.observaciones || "", b.atributo || "", b.id);
  const ex = d.prepare("SELECT id FROM alcancia WHERE integrante_id=?").get(b.id) as { id: number } | undefined;
  if (ex) d.prepare("UPDATE alcancia SET dio=?, monto=? WHERE integrante_id=?").run(b.dio ? 1 : 0, Number(b.monto) || 0, b.id);
  else d.prepare("INSERT INTO alcancia (integrante_id, dio, monto) VALUES (?,?,?)").run(b.id, b.dio ? 1 : 0, Number(b.monto) || 0);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const n = await ok(); if (n) return n;
  const id = new URL(req.url).searchParams.get("id");
  const d = db();
  d.prepare("DELETE FROM alcancia WHERE integrante_id=?").run(Number(id));
  d.prepare("DELETE FROM integrantes WHERE id=?").run(Number(id));
  return NextResponse.json({ ok: true });
}
