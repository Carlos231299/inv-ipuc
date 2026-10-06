import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/auth";
import { buildPdf, buildFicha, buildCsv, type ReportKind } from "@/lib/pdf";

const FN: Record<string, string> = {
  personal: "personal", grupos: "grupos-rotacion", alcancia: "alcancia",
  equipos: "inventario-sonido", general: "resumen-general",
};

export async function GET(req: Request) {
  if (!(await sessionUser())) return NextResponse.json({ error: "no auth" }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const kind = (q.get("kind") || "general") as ReportKind | "ficha-integrante" | "ficha-equipo";
  const format = q.get("format") || "pdf";
  const id = Number(q.get("id") || 0);

  if (format === "csv") {
    const csv = buildCsv(kind as "personal" | "alcancia" | "equipos");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${FN[kind] || kind}.csv"`,
      },
    });
  }
  const bytes = kind === "ficha-integrante" ? await buildFicha("integrante", id)
    : kind === "ficha-equipo" ? await buildFicha("equipo", id)
    : await buildPdf(kind as ReportKind);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${FN[kind] || kind}.pdf"`,
    },
  });
}
