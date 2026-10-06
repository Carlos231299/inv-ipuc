import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/auth";
import { db, lideres } from "@/lib/db";
import { MINISTERIOS } from "@/lib/cargos";

const VALIDOS = new Set(MINISTERIOS.map((m) => m.nombre));

async function ok() {
  return (await sessionUser()) ? null : NextResponse.json({ error: "no auth" }, { status: 401 });
}

export async function GET() {
  const n = await ok(); if (n) return n;
  return NextResponse.json(lideres());
}

export async function POST(req: Request) {
  const n = await ok(); if (n) return n;
  const b = await req.json();
  if (!b.nombre?.trim() || !VALIDOS.has(b.ministerio))
    return NextResponse.json({ error: "datos" }, { status: 400 });
  const r = db().prepare(
    "INSERT INTO lideres (nombre, ministerio, cargo, telefono, foto, observaciones) VALUES (?,?,?,?,?,?)"
  ).run(b.nombre.trim(), b.ministerio, b.cargo || "", b.telefono || "", b.foto || null, b.observaciones || "");
  return NextResponse.json({ id: Number(r.lastInsertRowid) });
}

export async function PUT(req: Request) {
  const n = await ok(); if (n) return n;
  const b = await req.json();
  if (!b.nombre?.trim() || !VALIDOS.has(b.ministerio))
    return NextResponse.json({ error: "datos" }, { status: 400 });
  db().prepare("UPDATE lideres SET nombre=?, ministerio=?, cargo=?, telefono=?, foto=?, observaciones=? WHERE id=?")
    .run(b.nombre.trim(), b.ministerio, b.cargo || "", b.telefono || "", b.foto || null, b.observaciones || "", Number(b.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const n = await ok(); if (n) return n;
  db().prepare("DELETE FROM lideres WHERE id=?").run(Number(new URL(req.url).searchParams.get("id")));
  return NextResponse.json({ ok: true });
}
