import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

async function ok() {
  return (await sessionUser()) ? null : NextResponse.json({ error: "no auth" }, { status: 401 });
}

export async function GET() {
  const n = await ok(); if (n) return n;
  return NextResponse.json(db().prepare("SELECT * FROM equipos ORDER BY tipo, numero").all());
}

export async function POST(req: Request) {
  const n = await ok(); if (n) return n;
  const b = await req.json();
  const numero = Number(b.numero) || 1;
  const nombre = `${(b.tipo || "Equipo").trim()} #${numero}`;
  const r = db().prepare(
    "INSERT INTO equipos (tipo, numero, nombre, estado, ubicacion, foto, codigo, observaciones) VALUES (?,?,?,?,?,?,?,?)"
  ).run(b.tipo.trim(), numero, nombre, b.estado || "EN_USO", b.ubicacion || "Templo",
    b.foto || null, b.codigo || "", b.observaciones || "");
  return NextResponse.json({ id: Number(r.lastInsertRowid), nombre });
}

export async function PUT(req: Request) {
  const n = await ok(); if (n) return n;
  const b = await req.json();
  const numero = Number(b.numero) || 1;
  const nombre = `${(b.tipo || "Equipo").trim()} #${numero}`;
  db().prepare("UPDATE equipos SET tipo=?, numero=?, nombre=?, estado=?, ubicacion=?, foto=?, codigo=?, observaciones=? WHERE id=?")
    .run(b.tipo.trim(), numero, nombre, b.estado, b.ubicacion, b.foto || null, b.codigo || "", b.observaciones || "", b.id);
  return NextResponse.json({ ok: true, nombre });
}

export async function DELETE(req: Request) {
  const n = await ok(); if (n) return n;
  db().prepare("DELETE FROM equipos WHERE id=?").run(Number(new URL(req.url).searchParams.get("id")));
  return NextResponse.json({ ok: true });
}
