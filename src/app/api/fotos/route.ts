import { NextResponse } from "next/server";
import { writeFile, readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { existsSync } from "node:fs";
import { sessionUser } from "@/lib/auth";
import { DATA_DIR } from "@/lib/db";

const OK = [".jpg", ".jpeg", ".png", ".webp"];

export async function POST(req: Request) {
  if (!(await sessionUser())) return NextResponse.json({ error: "no auth" }, { status: 401 });
  const fd = await req.formData();
  const f = fd.get("foto") as File | null;
  if (!f) return NextResponse.json({ error: "sin archivo" }, { status: 400 });
  const ext = extname(f.name).toLowerCase() || ".jpg";
  if (!OK.includes(ext)) return NextResponse.json({ error: "formato" }, { status: 400 });
  const nombre = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
  await writeFile(join(DATA_DIR, "fotos", nombre), Buffer.from(await f.arrayBuffer()));
  return NextResponse.json({ foto: `fotos/${nombre}` });
}

export async function GET(req: Request) {
  if (!(await sessionUser())) return NextResponse.json({ error: "no auth" }, { status: 401 });
  const f = new URL(req.url).searchParams.get("f") || "";
  if (!/^fotos\/[\w.\-]+$/.test(f)) return NextResponse.json({ error: "ruta" }, { status: 400 });
  const p = join(DATA_DIR, f);
  if (!existsSync(p)) return NextResponse.json({ error: "no existe" }, { status: 404 });
  const ext = extname(p).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  return new NextResponse(await readFile(p), { headers: { "Content-Type": mime } });
}
