import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/auth";
import { buildPdf, buildFicha, type ReportKind } from "@/lib/pdf";

const FN: Record<string, string> = {
  personal: "personal", grupos: "grupos-rotacion", alcancia: "alcancia",
  equipos: "inventario-sonido", general: "resumen-general",
};

export async function GET(req: Request) {
  if (!(await sessionUser())) return NextResponse.json({ error: "no auth" }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const kind = (q.get("kind") || "general") as ReportKind | "ficha-integrante" | "ficha-equipo";
  const id = Number(q.get("id") || 0);

  const bytes = kind === "ficha-integrante" ? await buildFicha("integrante", id)
    : kind === "ficha-equipo" ? await buildFicha("equipo", id)
    : await buildPdf(kind as ReportKind);
  const buf = Buffer.from(bytes);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(buf.length),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=60",
      "Content-Disposition": `inline; filename="${FN[kind] || kind}.pdf"`,
    },
  });
}
