import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/auth";
import { grupos, integrantes, rotacion, nombreGrupo, db } from "@/lib/db";

async function ok() {
  return (await sessionUser()) ? null : NextResponse.json({ error: "no auth" }, { status: 401 });
}

export async function GET() {
  const n = await ok(); if (n) return n;
  const gs = grupos();
  const ms = integrantes();
  return NextResponse.json({
    grupos: gs.map((g) => ({
      ...g,
      miembros: ms.filter((m) => m.grupo_id === g.id)
        .map((m) => ({ id: m.id, nombre: m.nombre, rol: m.rol, estado: m.estado, observaciones: m.observaciones })),
    })),
    sinGrupo: ms.filter((m) => m.grupo_id == null)
      .map((m) => ({ id: m.id, nombre: m.nombre, rol: m.rol, estado: m.estado, observaciones: m.observaciones })),
    rotacion: rotacion().map((r) => ({ ...r, grupo: nombreGrupo(r.grupo_id) })),
  });
}

export async function POST(req: Request) {
  const n = await ok(); if (n) return n;
  const b = await req.json();
  if (!b.nombre?.trim()) return NextResponse.json({ error: "nombre" }, { status: 400 });
  const r = db().prepare("INSERT INTO grupos_voz (nombre) VALUES (?)").run(b.nombre.trim());
  return NextResponse.json({ id: Number(r.lastInsertRowid) });
}

export async function PUT(req: Request) {
  const n = await ok(); if (n) return n;
  const b = await req.json();
  if (!b.nombre?.trim()) return NextResponse.json({ error: "nombre" }, { status: 400 });
  db().prepare("UPDATE grupos_voz SET nombre=? WHERE id=?").run(b.nombre.trim(), Number(b.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const n = await ok(); if (n) return n;
  const id = Number(new URL(req.url).searchParams.get("id"));
  const d = db();
  d.prepare("UPDATE integrantes SET grupo_id=NULL WHERE grupo_id=?").run(id);
  d.prepare("DELETE FROM rotacion WHERE grupo_id=?").run(id);
  d.prepare("DELETE FROM grupos_voz WHERE id=?").run(id);
  return NextResponse.json({ ok: true });
}
