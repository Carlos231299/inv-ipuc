import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/auth";
import { ajuste, db } from "@/lib/db";

export async function GET() {
  if (!(await sessionUser())) return NextResponse.json({ error: "no auth" }, { status: 401 });
  return NextResponse.json({
    firma_nombre: ajuste("firma_nombre") ?? "Gerson Acosta",
    firma_cargo: ajuste("firma_cargo") ?? "Líder de Música",
  });
}

export async function PUT(req: Request) {
  if (!(await sessionUser())) return NextResponse.json({ error: "no auth" }, { status: 401 });
  const b = await req.json();
  const nombre = String(b.firma_nombre || "").trim();
  const cargo = String(b.firma_cargo || "").trim();
  if (!nombre || !cargo) return NextResponse.json({ error: "datos" }, { status: 400 });
  const d = db();
  const up = d.prepare(
    "INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor");
  up.run("firma_nombre", nombre);
  up.run("firma_cargo", cargo);
  return NextResponse.json({ ok: true });
}
