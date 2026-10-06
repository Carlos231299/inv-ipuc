import { NextResponse } from "next/server";
import { writeFile, readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { sessionUser } from "@/lib/auth";
import { DATA_DIR, db } from "@/lib/db";

export async function GET() {
  if (!(await sessionUser())) return NextResponse.json({ error: "no auth" }, { status: 401 });
  const nombre = (db().prepare("SELECT valor FROM ajustes WHERE clave='logo'").get() as { valor: string } | undefined)?.valor;
  if (!nombre) return NextResponse.json({ error: "sin logo" }, { status: 404 });
  const ext = extname(nombre).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  return new NextResponse(await readFile(join(DATA_DIR, "escudo", nombre)), {
    headers: { "Content-Type": mime },
  });
}

export async function POST(req: Request) {
  if (!(await sessionUser())) return NextResponse.json({ error: "no auth" }, { status: 401 });
  const fd = await req.formData();
  const f = fd.get("escudo") as File | null;
  if (!f) return NextResponse.json({ error: "sin archivo" }, { status: 400 });
  const ext = extname(f.name).toLowerCase() || ".png";
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext))
    return NextResponse.json({ error: "formato" }, { status: 400 });
  const nombre = `escudo${ext}`;
  await writeFile(join(DATA_DIR, "escudo", nombre), Buffer.from(await f.arrayBuffer()));
  db().prepare("INSERT INTO ajustes (clave, valor) VALUES ('logo', ?) ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor").run(nombre);
  return NextResponse.json({ ok: true });
}
