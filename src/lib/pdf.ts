import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";
import { readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { DATA_DIR, db, totalRecogido } from "./db";
import { eq, ep, fmtCOP, HEADER_IGLESIA, FOOTER_FIRMA } from "./etiquetas";

const W = 595, H = 842, M = 40;
const NAVY = rgb(0.13, 0.22, 0.42);
const LIGHT = rgb(0.93, 0.95, 0.98);
const GRAY = rgb(0.45, 0.45, 0.45);

function fechaHora(): string {
  return new Date().toLocaleString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function logoFile(): string | null {
  const nombre = (db().prepare("SELECT valor FROM ajustes WHERE clave='logo'").get() as { valor: string } | undefined)?.valor;
  if (!nombre) return null;
  const f = join(DATA_DIR, "escudo", nombre);
  return existsSync(f) ? f : null;
}

async function embedImg(doc: PDFDocument, path: string): Promise<PDFImage | null> {
  try {
    const b = readFileSync(path);
    const e = extname(path).toLowerCase();
    if (e === ".png") return await doc.embedPng(b);
    return await doc.embedJpg(b);
  } catch { return null; }
}

type Ctx = {
  doc: PDFDocument; font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  bold: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  page: ReturnType<PDFDocument["addPage"]>; y: number; num: number;
  logo: PDFImage | null; tipo: string;
};

async function nueva(c: Ctx): Promise<void> {
  pie(c);
  c.page = c.doc.addPage([W, H]);
  c.num++;
  encabezado(c);
  marcaAgua(c);
  c.y = H - 130;
}

function encabezado(c: Ctx) {
  const p = c.page;
  // Escudo pequeño + títulos
  let tx = M;
  if (c.logo) {
    const s = 44;
    const sc = Math.min(s / c.logo.width, s / c.logo.height);
    p.drawImage(c.logo, { x: M, y: H - 78, width: c.logo.width * sc, height: c.logo.height * sc });
    tx = M + 54;
  }
  p.drawText(`Reporte de ${c.tipo}`, { x: tx, y: H - 52, size: 17, font: c.bold, color: NAVY });
  p.drawText(HEADER_IGLESIA, { x: tx, y: H - 70, size: 11, font: c.font, color: GRAY });
  p.drawLine({ start: { x: M, y: H - 86 }, end: { x: W - M, y: H - 86 }, thickness: 1.5, color: NAVY });
}

function marcaAgua(c: Ctx) {
  if (!c.logo) return;
  const p = c.page;
  const sc = Math.min(320 / c.logo.width, 320 / c.logo.height);
  p.drawImage(c.logo, {
    x: W / 2 - (c.logo.width * sc) / 2, y: H / 2 - (c.logo.height * sc) / 2,
    width: c.logo.width * sc, height: c.logo.height * sc, opacity: 0.09,
  });
}

function pie(c: Ctx) {
  const p = c.page;
  p.drawLine({ start: { x: M, y: 44 }, end: { x: W - M, y: 44 }, thickness: 0.75, color: NAVY });
  p.drawText(`${FOOTER_FIRMA}  ·  ${fechaHora()}`, { x: M, y: 30, size: 8.5, font: c.font, color: GRAY });
  p.drawText(`Pág. ${c.num}`, { x: W - M - 40, y: 30, size: 8.5, font: c.font, color: GRAY });
}

async function tabla(c: Ctx, cols: { t: string; w: number }[], filas: string[][], opts?: { zebra?: boolean; thumbs?: (PDFImage | null)[] }) {
  const total = cols.reduce((a, x) => a + x.w, 0);
  const ff = c.font, fb = c.bold;
  const conFoto = !!opts?.thumbs;
  const rowH = conFoto ? 38 : 17;
  const drawHead = () => {
    let x = M;
    c.page.drawRectangle({ x: M, y: c.y - 4, width: total, height: 20, color: NAVY });
    cols.forEach((col) => {
      c.page.drawText(col.t, { x: x + 4, y: c.y, size: 9.5, font: fb, color: rgb(1, 1, 1) });
      x += col.w;
    });
    c.y -= 20;
  };
  drawHead();
  let i = 0;
  for (const f of filas) {
    if (c.y < 70) { await nueva(c); drawHead(); }
    if (opts?.zebra !== false && i % 2 === 1)
      c.page.drawRectangle({ x: M, y: c.y - 4, width: total, height: rowH, color: LIGHT });
    let x = M;
    f.forEach((cell, j) => {
      if (!(conFoto && j === 0)) {
        const ty = conFoto ? c.y - 8 : c.y;
        c.page.drawText(cell.slice(0, 48), { x: x + 4, y: ty, size: 9, font: ff });
      }
      x += cols[j].w;
    });
    if (conFoto) {
      const img = opts!.thumbs![i];
      if (img) {
        const sc = Math.min(48 / img.width, 30 / img.height);
        const w = img.width * sc, h = img.height * sc;
        c.page.drawImage(img, { x: M + (cols[0].w - w) / 2, y: c.y - 2 - h, width: w, height: h });
      } else {
        c.page.drawText("—", { x: M + cols[0].w / 2 - 3, y: c.y - 8, size: 9, font: ff, color: GRAY });
      }
    }
    // líneas de grilla
    let gx = M;
    c.page.drawLine({ start: { x: M, y: c.y - 4 }, end: { x: M + total, y: c.y - 4 }, thickness: 0.4, color: GRAY });
    for (const col of cols) { gx += col.w; c.page.drawLine({ start: { x: gx, y: c.y - 4 }, end: { x: gx, y: c.y + rowH - 4 }, thickness: 0.4, color: GRAY }); }
    c.y -= rowH; i++;
  }
}

// Carga miniaturas de fotos (rutas relativas a DATA_DIR) con caché
async function cargarThumbs(doc: PDFDocument, rutas: (string | null | undefined)[]): Promise<(PDFImage | null)[]> {
  const cache = new Map<string, PDFImage | null>();
  const out: (PDFImage | null)[] = [];
  for (const r of rutas) {
    if (!r) { out.push(null); continue; }
    if (!cache.has(r)) {
      cache.set(r, await embedImg(doc, join(DATA_DIR, r)));
    }
    out.push(cache.get(r) ?? null);
  }
  return out;
}

async function titulo2(c: Ctx, t: string) {
  if (c.y < 90) await nueva(c);
  c.page.drawText(t, { x: M, y: c.y, size: 13, font: c.bold, color: NAVY });
  c.y -= 22;
}

async function parrafo(c: Ctx, t: string) {
  if (c.y < 70) await nueva(c);
  c.page.drawText(t.slice(0, 110), { x: M, y: c.y, size: 10, font: c.font });
  c.y -= 16;
}

export type ReportKind = "personal" | "grupos" | "alcancia" | "equipos" | "general";
export const TITULOS: Record<ReportKind, string> = {
  personal: "Personal del Grupo de Alabanza",
  grupos: "Grupos de Voces y Rotación",
  alcancia: "Alcancía / Voto (montos visibles)",
  equipos: "Inventario de Equipos de Sonido",
  general: "Resumen General del Grupo de Alabanza",
};

export async function buildPdf(kind: ReportKind, extra?: { id?: number }): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const lf = logoFile();
  const logo = lf ? await embedImg(doc, lf) : null;
  const c: Ctx = { doc, font, bold, page: doc.addPage([W, H]), y: H - 130, num: 1, logo, tipo: TITULOS[kind] };
  encabezado(c); marcaAgua(c);

  const d = db();
  if (kind === "personal" || kind === "general") {
    if (kind === "general") await titulo2(c, "1. Personal");
    const ints = d.prepare("SELECT * FROM integrantes ORDER BY nombre").all() as Record<string, unknown>[];
    const rows = ints.map((r) => [
      String(r.nombre), ep(String(r.estado)),
      nombreDe(Number(r.grupo_id)), String(r.rol), String(r.telefono || "—"),
    ]);
    await tabla(c, [{ t: "Nombre", w: 150 }, { t: "Estado", w: 95 }, { t: "Grupo", w: 120 }, { t: "Rol", w: 70 }, { t: "Teléfono", w: 80 }], rows);
  }
  if (kind === "grupos" || kind === "general") {
    if (kind === "general") await titulo2(c, "2. Grupos de voces");
    else await titulo2(c, "Integrantes por grupo");
    const gs = d.prepare("SELECT * FROM grupos_voz ORDER BY nombre").all() as { id: number; nombre: string }[];
    for (const g of gs) {
      await parrafo(c, `${g.nombre}:`);
      const ms = d.prepare("SELECT nombre, rol FROM integrantes WHERE grupo_id=? ORDER BY nombre").all(g.id) as { nombre: string; rol: string }[];
      await tabla(c, [{ t: "Nombre", w: 350 }, { t: "Rol", w: 165 }], ms.map((m) => [m.nombre, m.rol]));
      c.y -= 8;
    }
    await titulo2(c, "Rotación semanal");
    const rot = d.prepare("SELECT dia, grupo_id FROM rotacion ORDER BY orden").all() as { dia: string; grupo_id: number }[];
    await tabla(c, [{ t: "Día / servicio", w: 200 }, { t: "Grupo", w: 315 }], rot.map((r) => [r.dia, nombreDe(r.grupo_id)]));
    await parrafo(c, "Nota: el grupo del domingo en la noche repite el martes.");
  }
  if (kind === "alcancia" || kind === "general") {
    if (kind === "general") await titulo2(c, "3. Alcancía / voto");
    const rows = d.prepare(
      `SELECT i.nombre, a.dio, a.monto FROM integrantes i LEFT JOIN alcancia a ON a.integrante_id=i.id
       WHERE i.estado='ACTIVO' ORDER BY i.nombre`).all() as { nombre: string; dio: number; monto: number }[];
    await tabla(c, [{ t: "Integrante", w: 300 }, { t: "Estado", w: 100 }, { t: "Monto", w: 115 }],
      rows.map((r) => [r.nombre, r.dio ? "Dio" : "Pendiente", r.dio ? fmtCOP(r.monto) : "—"]));
    await parrafo(c, `Total recogido: ${fmtCOP(totalRecogido())} · Dieron ${rows.filter((r) => r.dio).length} de ${rows.length}.`);
  }
  if (kind === "equipos" || kind === "general") {
    if (kind === "general") await titulo2(c, "4. Equipos de sonido");
    const eqs = d.prepare("SELECT * FROM equipos ORDER BY tipo, numero").all() as Record<string, unknown>[];
    const thumbs = await cargarThumbs(doc, eqs.map((e) => (e.foto ? String(e.foto) : null)));
    await tabla(c, [{ t: "Foto", w: 56 }, { t: "Unidad", w: 168 }, { t: "Estado", w: 85 }, { t: "Ubicación", w: 80 }, { t: "Código", w: 126 }],
      eqs.map((e) => ["", String(e.nombre), eq(String(e.estado)), String(e.ubicacion), String(e.codigo)]),
      { thumbs });
    const enUso = eqs.filter((e) => e.estado === "EN_USO").length;
    await parrafo(c, `Total: ${eqs.length} unidades · En uso: ${enUso}.`);
  }
  if (kind === "general") {
    await titulo2(c, "5. Entrega del área");
    await parrafo(c, "Se deja constancia del estado actual del Grupo de Alabanza, su personal,");
    await parrafo(c, "grupos de voces, rotación y equipos de sonido.");
    c.y -= 30;
    await parrafo(c, "Entregado por: Gerson Acosta");
    await parrafo(c, "Recibido por: ____________________     Firma: __________");
  }
  if (extra?.id && (kind === "personal" || kind === "equipos")) {
    // Ficha individual: se antepone foto + detalle (las tablas ya salieron arriba; aquí solo nota)
    void 0;
  }
  pie(c);
  return doc.save();
}

export async function buildFicha(tipo: "integrante" | "equipo", id: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const lf = logoFile();
  const logo = lf ? await embedImg(doc, lf) : null;
  const nombre = tipo === "integrante" ? "Ficha de Integrante" : "Ficha de Equipo";
  const c: Ctx = { doc, font, bold, page: doc.addPage([W, H]), y: H - 130, num: 1, logo, tipo: nombre };
  encabezado(c); marcaAgua(c);
  const d = db();
  if (tipo === "integrante") {
    const r = d.prepare("SELECT * FROM integrantes WHERE id=?").get(id) as Record<string, unknown> | undefined;
    if (!r) throw new Error("No existe");
    if (r.foto && existsSync(String(r.foto))) {
      const img = await embedImg(doc, String(r.foto));
      if (img) {
        const sc = Math.min(180 / img.width, 180 / img.height);
        c.page.drawImage(img, { x: M, y: c.y - 180 * sc, width: img.width * sc, height: img.height * sc });
        c.y -= 180 * sc + 14;
      }
    }
    await tabla(c, [{ t: "Campo", w: 150 }, { t: "Valor", w: 365 }], [
      ["Nombre", String(r.nombre)], ["Estado", ep(String(r.estado))],
      ["Grupo", nombreDe(Number(r.grupo_id))], ["Rol", String(r.rol)],
      ["Teléfono", String(r.telefono || "—")], ["Observaciones", String(r.observaciones || "—")],
    ]);
  } else {
    const r = d.prepare("SELECT * FROM equipos WHERE id=?").get(id) as Record<string, unknown> | undefined;
    if (!r) throw new Error("No existe");
    if (r.foto && existsSync(String(r.foto))) {
      const img = await embedImg(doc, String(r.foto));
      if (img) {
        const sc = Math.min(220 / img.width, 220 / img.height);
        c.page.drawImage(img, { x: M, y: c.y - 220 * sc, width: img.width * sc, height: img.height * sc });
        c.y -= 220 * sc + 14;
      }
    }
    await tabla(c, [{ t: "Campo", w: 150 }, { t: "Valor", w: 365 }], [
      ["Unidad", String(r.nombre)], ["Tipo", String(r.tipo)], ["Número", `#${r.numero}`],
      ["Estado", eq(String(r.estado))], ["Ubicación", String(r.ubicacion)],
      ["Código", String(r.codigo)], ["Observaciones", String(r.observaciones || "—")],
    ]);
  }
  pie(c);
  return doc.save();
}

function nombreDe(id: number | null): string {
  if (id == null) return "Sin grupo";
  const g = db().prepare("SELECT nombre FROM grupos_voz WHERE id=?").get(id) as { nombre: string } | undefined;
  return g?.nombre ?? "Sin grupo";
}
