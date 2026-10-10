import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";
import { readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { DATA_DIR, db, totalRecogido, ajuste } from "./db";
import { eq, ep, fmtCOP, HEADER_IGLESIA } from "./etiquetas";


export function firmaCargo(): string {
  const c = ajuste("firma_cargo") ?? "Líder de Alabanza";
  // Migración: valor temporal antiguo -> cargo formal
  return c === "Líder de Música" ? "Líder de Alabanza" : c;
}
export function firmaTexto(): string {
  const n = ajuste("firma_nombre") ?? "Gerson Acosta";
  return `Generado por ${n} – ${firmaCargo()}`;
}
export function firmaNombre(): string {
  return ajuste("firma_nombre") ?? "Gerson Acosta";
}

const W = 595, H = 842, M = 40;
const NAVY = rgb(0.13, 0.22, 0.42);
const LIGHT = rgb(0.93, 0.95, 0.98);
const GRAY = rgb(0.45, 0.45, 0.45);

function fechaHora(): string {
  return new Date().toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
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
  logo: PDFImage | null; tipo: string; pgW: number; pgH: number;
};

function newCtx(doc: PDFDocument, font: Ctx["font"], bold: Ctx["bold"], logo: PDFImage | null, tipo: string): Ctx {
  const c: Ctx = { doc, font, bold, page: doc.addPage([W, H]), y: H - 104, num: 1, logo, tipo, pgW: W, pgH: H };
  encabezado(c);
  return c;
}

async function nueva(c: Ctx): Promise<void> {
  pie(c);
  c.page = c.doc.addPage([c.pgW, c.pgH]);
  c.num++;
  encabezado(c);
  c.y = c.pgH - 104;
}

function encabezado(c: Ctx) {
  const p = c.page;
  const { pgW, pgH } = c;
  // Escudo pequeño + títulos
  let tx = M;
  if (c.logo) {
    const s = 44;
    const sc = Math.min(s / c.logo.width, s / c.logo.height);
    p.drawImage(c.logo, { x: M, y: pgH - 78, width: c.logo.width * sc, height: c.logo.height * sc });
    tx = M + 54;
  }
  p.drawText(`Reporte de ${c.tipo}`, { x: tx, y: pgH - 52, size: 17, font: c.bold, color: NAVY });
  p.drawText(HEADER_IGLESIA, { x: tx, y: pgH - 70, size: 11, font: c.font, color: GRAY });
  p.drawLine({ start: { x: M, y: pgH - 86 }, end: { x: pgW - M, y: pgH - 86 }, thickness: 1.5, color: NAVY });
}

function marcaAgua(c: Ctx, opacidad = 0.09) {
  if (!c.logo) return;
  const p = c.page;
  const { pgW, pgH } = c;
  const sc = Math.min(320 / c.logo.width, 320 / c.logo.height);
  p.drawImage(c.logo, {
    x: pgW / 2 - (c.logo.width * sc) / 2, y: pgH / 2 - (c.logo.height * sc) / 2,
    width: c.logo.width * sc, height: c.logo.height * sc, opacity: opacidad,
  });
}

function pie(c: Ctx) {
  const p = c.page;
  // Marca de agua AL FINAL (encima del contenido, tenue): no la cortan tablas ni fotos
  marcaAgua(c, 0.07);
  p.drawLine({ start: { x: M, y: 44 }, end: { x: c.pgW - M, y: 44 }, thickness: 0.75, color: NAVY });
  p.drawText(`${firmaTexto()}  ·  ${fechaHora()}`, { x: M, y: 30, size: 8.5, font: c.font, color: GRAY });
  p.drawText(`Pág. ${c.num}`, { x: c.pgW - M - 40, y: 30, size: 8.5, font: c.font, color: GRAY });
}

async function tabla(c: Ctx, cols: { t: string; w: number }[], filas: string[][], opts?: { zebra?: boolean; thumbs?: (PDFImage | null)[] }) {
  const total = cols.reduce((a, x) => a + x.w, 0);
  const ff = c.font, fb = c.bold;
  // Aire antes de cada tabla + keep-with-next (header + 2 filas juntos)
  if (c.y < 160) await nueva(c);
  c.y -= 2;
  const conFoto = !!opts?.thumbs;
  const rowH = conFoto ? 40 : 22;
  const thumbMaxW = 50, thumbMaxH = 32;
  const drawHead = () => {
    let x = M;
    c.page.drawRectangle({ x: M, y: c.y - 30, width: total, height: 24, color: NAVY });
    cols.forEach((col) => {
      c.page.drawText(col.t.toUpperCase(), { x: x + 6, y: c.y - 21, size: 9.5, font: fb, color: rgb(1, 1, 1) });
      x += col.w;
    });
    c.y -= 30;
  };
  drawHead();
  let i = 0;
  for (const f of filas) {
    // Fila combinada "## texto": banda de grupo centrada a lo ancho
    if (f.length === 1 && f[0].startsWith("##")) {
      const t = f[0].slice(2).toUpperCase();
      const rh = 24;
      if (c.y - rh < 66) { await nueva(c); drawHead(); }
      const top = c.y - 4;
      c.page.drawRectangle({ x: M, y: top - rh, width: total, height: rh, color: rgb(0.88, 0.91, 0.97) });
      const w = fb.widthOfTextAtSize(t, 10);
      c.page.drawText(t, { x: M + (total - w) / 2, y: top - 16, size: 10, font: fb, color: NAVY });
      c.page.drawLine({ start: { x: M, y: top - rh }, end: { x: M + total, y: top - rh }, thickness: 0.5, color: rgb(0.82, 0.85, 0.9) });
      c.y = top - rh; i++;
      continue;
    }
    // Envuelve cada celda: nada se recorta, la fila crece según líneas
    const celdas = f.map((cell, j) => (conFoto && j === 0 ? [""] : envolver(ff, cell, 9, cols[j].w - 12)));
    const nLineas = Math.max(1, ...celdas.map((l) => l.length));
    const rh = Math.max(rowH, nLineas * 13 + 10);
    if (c.y - rh < 66) { await nueva(c); drawHead(); }
    const top = c.y - 4;
    if (opts?.zebra !== false && i % 2 === 1)
      c.page.drawRectangle({ x: M, y: top - rh, width: total, height: rh, color: LIGHT });
    let x = M;
    celdas.forEach((lns, j) => {
      lns.forEach((ln, k) => {
        c.page.drawText(ln, { x: x + 6, y: top - 13 - k * 13, size: 9, font: ff });
      });
      x += cols[j].w;
    });
    if (conFoto) {
      const img = opts!.thumbs![i];
      if (img) {
        const sc = Math.min(thumbMaxW / img.width, thumbMaxH / img.height);
        const w = img.width * sc, h = img.height * sc;
        c.page.drawImage(img, { x: M + (cols[0].w - w) / 2, y: top - (rh - h) / 2 - h, width: w, height: h });
      } else {
        c.page.drawText("—", { x: M + cols[0].w / 2 - 3, y: top - rh / 2 - 3, size: 10, font: ff, color: GRAY });
      }
    }
    // Solo hairline horizontal (sin grilla vertical): look limpio, no "Word"
    c.page.drawLine({ start: { x: M, y: top - rh }, end: { x: M + total, y: top - rh }, thickness: 0.5, color: rgb(0.82, 0.85, 0.9) });
    c.y = top - rh; i++;
  }
  c.y -= 6; // aire tras la tabla para notas siguientes no pegadas
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
  // Anti-huérfanos calibrado: título + ~2 filas necesitan ~110px
  if (c.y < 110) await nueva(c);
  else c.y -= 10; // aire tras tabla/contenido previo (no pegados)
  c.page.drawText(t, { x: M, y: c.y, size: 13, font: c.bold, color: NAVY });
  c.y -= 10;
}

// Secciones del general: hoja nueva SOLO si quedan <300px (si cabe, fluye)
async function tituloSeccion(c: Ctx, t: string) {
  if (c.y < 300 && c.y < c.pgH - 130) await nueva(c);
  await titulo2(c, t);
}

async function parrafo(c: Ctx, t: string) {
  for (const ln of envolver(c.font, t, 10, c.pgW - M * 2)) {
    if (c.y < 70) await nueva(c);
    c.page.drawText(ln, { x: M, y: c.y, size: 10, font: c.font });
    c.y -= 14;
  }
  c.y -= 3;
}

export type ReportKind = "personal" | "grupos" | "alcancia" | "equipos" | "general";
export const TITULOS: Record<ReportKind, string> = {
  personal: "Personal del Grupo de Alabanza",
  grupos: "Grupos de Voces y Rotación",
  alcancia: "Alcancía / Voto (montos visibles)",
  equipos: "Inventario de Equipos de Sonido",
  general: "Resumen General — Inventario IPUC 19",
};

function centrado(c: Ctx, texto: string, size: number, font: Ctx["font"]): number {
  return (c.pgW - font.widthOfTextAtSize(texto, size)) / 2;
}

// Tabla de grupos en 3 columnas: NOMBRE DEL GRUPO | INTEGRANTE | ROL.
// El nombre del grupo se centra verticalmente abarcando sus filas (ahorra espacio).
async function tablaGrupos(c: Ctx, gs: { id: number; nombre: string }[]) {
  const d = db();
  const ff = c.font, fb = c.bold;
  const wG = 150, wI = 200, wR = 165, total = wG + wI + wR;
  if (c.y < 160) await nueva(c);
  c.y -= 2;
  const drawHead = () => {
    c.page.drawRectangle({ x: M, y: c.y - 30, width: total, height: 24, color: NAVY });
    c.page.drawText("NOMBRE DEL GRUPO", { x: M + 6, y: c.y - 21, size: 9.5, font: fb, color: rgb(1, 1, 1) });
    c.page.drawText("INTEGRANTE", { x: M + wG + 6, y: c.y - 21, size: 9.5, font: fb, color: rgb(1, 1, 1) });
    c.page.drawText("ROL", { x: M + wG + wI + 6, y: c.y - 21, size: 9.5, font: fb, color: rgb(1, 1, 1) });
    c.y -= 30;
  };
  drawHead();
  for (let gi = 0; gi < gs.length; gi++) {
    const g = gs[gi];
    const ms = d.prepare("SELECT nombre, rol FROM integrantes WHERE grupo_id=? ORDER BY nombre").all(g.id) as { nombre: string; rol: string }[];
    const filas: string[][] = ms.length ? ms.map((m) => [m.nombre, m.rol]) : [["Sin integrantes registrados", "—"]];
    const altos = filas.map((f) => Math.max(22,
      Math.max(envolver(ff, f[0], 9, wI - 12).length, envolver(ff, f[1], 9, wR - 12).length) * 13 + 10));
    const bloque = altos.reduce((a, b) => a + b, 0);
    // Cada grupo viaja junto (no se parte entre hojas)
    if (c.y - bloque < 66) { await nueva(c); drawHead(); }
    const topBloque = c.y - 4;
    if (gi % 2 === 1) {
      c.page.drawRectangle({ x: M, y: topBloque - bloque, width: total, height: bloque, color: LIGHT });
    }
    // Nombre del grupo centrado verticalmente en su bloque
    const gLineas = envolver(fb, g.nombre, 10, wG - 12);
    const baseG = topBloque - bloque / 2 + ((gLineas.length - 1) * 13) / 2;
    gLineas.forEach((ln, k) => {
      c.page.drawText(ln, { x: M + 6, y: baseG - k * 13, size: 10, font: fb, color: NAVY });
    });
    // Filas de integrantes con hairlines
    let y = topBloque;
    filas.forEach((f, k) => {
      const rh = altos[k];
      const lnI = envolver(ff, f[0], 9, wI - 12);
      const lnR = envolver(ff, f[1], 9, wR - 12);
      lnI.forEach((ln, n) => c.page.drawText(ln, { x: M + wG + 6, y: y - 13 - n * 13, size: 9, font: ff }));
      lnR.forEach((ln, n) => c.page.drawText(ln, { x: M + wG + wI + 6, y: y - 13 - n * 13, size: 9, font: ff }));
      c.page.drawLine({ start: { x: M, y: y - rh }, end: { x: M + total, y: y - rh }, thickness: 0.5, color: rgb(0.82, 0.85, 0.9) });
      y -= rh;
    });
    c.y = topBloque - bloque;
  }
  c.y -= 6; // aire tras la tabla
}

// Divide un texto en líneas que caben en maxW (sin recortar nada)
function envolver(font: Ctx["font"], texto: string, size: number, maxW: number): string[] {
  const palabras = texto.split(/\s+/).filter(Boolean);
  if (!palabras.length) return [""];
  const lineas: string[] = [];
  let actual = "";
  for (const p of palabras) {
    const prueba = actual ? actual + " " + p : p;
    if (font.widthOfTextAtSize(prueba, size) <= maxW || !actual) actual = prueba;
    else { lineas.push(actual); actual = p; }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

async function parrafoCentrado(c: Ctx, texto: string, size: number, color = GRAY) {
  for (const ln of envolver(c.font, texto, size, c.pgW - M * 2)) {
    if (c.y < 70) await nueva(c);
    c.page.drawText(ln, { x: centrado(c, ln, size, c.font), y: c.y, size, font: c.font, color });
    c.y -= size + 4;
  }
}

// Contenido de ficha de equipo (misma estructura en individual y general):
// nombre + foto centrada con marco + <br> + tabla Campo/Valor completa
async function contenidoFichaEquipo(c: Ctx, doc: PDFDocument, r: Record<string, unknown>) {
  if (c.y < 300) await nueva(c);
  const nombre = String(r.nombre);
  c.page.drawText(nombre, { x: centrado(c, nombre, 16, c.bold), y: c.y, size: 16, font: c.bold, color: NAVY });
  c.y -= 28;
  // Evidencias: hasta 3 fotos en fila, centradas, con marco y etiqueta
  const rels = [r.foto, (r as Record<string, unknown>).foto2, (r as Record<string, unknown>).foto3]
    .filter((f): f is string => typeof f === "string" && f.length > 0);
  const imgs: PDFImage[] = [];
  for (const rel of rels) {
    const full = join(DATA_DIR, rel);
    if (existsSync(full)) {
      const im = await embedImg(doc, full);
      if (im) imgs.push(im);
    }
  }
  if (imgs.length) {
    if (c.y < 280) await nueva(c);
    const boxW = Math.min(160, (c.pgW - M * 2 - 16) / imgs.length);
    const dims = imgs.map((im) => {
      const sc = Math.min(boxW / im.width, 130 / im.height);
      return { im, w: im.width * sc, h: im.height * sc };
    });
    const filaH = Math.max(...dims.map((d) => d.h));
    const totalW = dims.reduce((a, d) => a + d.w, 0) + 8 * (dims.length - 1);
    let x = (c.pgW - totalW) / 2;
    for (let k = 0; k < dims.length; k++) {
      const { im, w, h } = dims[k];
      const y0 = c.y - (filaH - h) / 2;
      c.page.drawRectangle({ x: x - 3, y: y0 - h - 3, width: w + 6, height: h + 6, borderColor: NAVY, borderWidth: 1 });
      c.page.drawImage(im, { x, y: y0 - h, width: w, height: h });
      const et = `Foto ${k + 1}`;
      c.page.drawText(et, { x: x + (w - c.font.widthOfTextAtSize(et, 8)) / 2, y: y0 - h - 14, size: 8, font: c.font, color: GRAY });
      x += w + 8;
    }
    c.y -= filaH + 30;
  } else {
    const t = "(Sin fotos registradas para esta unidad)";
    c.page.drawText(t, { x: centrado(c, t, 11, c.font), y: c.y, size: 11, font: c.font, color: GRAY });
    c.y -= 26;
  }
  c.y -= 8; // <br> entre imágenes y tabla
  await tabla(c, [{ t: "Campo", w: 150 }, { t: "Valor", w: 365 }], [
    ["Unidad", String(r.nombre)], ["Tipo", String(r.tipo)], ["Número", `#${r.numero}`],
    ["Estado", eq(String(r.estado))], ["Ubicación", String(r.ubicacion)],
    ["Código", String(r.codigo)], ["Observaciones", String(r.observaciones || "—")],
  ]);
}

// ===== SECCIÓN 3 (general): Acta de Entrega y Firma (diseño tarjeta visual) =====
async function seccionActaEntrega(c: Ctx) {
  const p = c.page;
  const BLANCO = rgb(1, 1, 1);
  const GOLD = rgb(0.79, 0.64, 0.15);
  const ancho = c.pgW - M * 2;

  await tituloSeccion(c, "3. Acta de Entrega y Firma");

  // --- Bloque encabezado azul (fondo navy) ---
  const hHead = 104;
  if (c.y - hHead < 70) await nueva(c);
  p.drawRectangle({ x: M, y: c.y - hHead, width: ancho, height: hHead, color: NAVY });
  const cx = (txt: string, size: number, f: typeof c.font) =>
    M + (ancho - f.widthOfTextAtSize(txt, size)) / 2;
  p.drawText("GRUPO DE", { x: cx("GRUPO DE", 10, c.font), y: c.y - 24, size: 10, font: c.font, color: BLANCO });
  p.drawText("Alabanza", { x: cx("Alabanza", 30, c.bold), y: c.y - 60, size: 30, font: c.bold, color: BLANCO });
  const pill = "2026";
  const pillW = c.bold.widthOfTextAtSize(pill, 12) + 28;
  p.drawRectangle({ x: M + (ancho - pillW) / 2, y: c.y - hHead + 10, width: pillW, height: 20, color: BLANCO });
  p.drawText(pill, { x: M + (ancho - pillW) / 2 + 14, y: c.y - hHead + 15, size: 12, font: c.bold, color: NAVY });
  c.y -= hHead + 10;

  // --- Barra de sección ---
  const hBar = 30;
  if (c.y - hBar < 70) await nueva(c);
  p.drawRectangle({ x: M, y: c.y - hBar, width: ancho, height: hBar, color: rgb(0.19, 0.3, 0.55) });
  p.drawText("3. ACTA DE ENTREGA Y FIRMA", { x: M + 14, y: c.y - 21, size: 12, font: c.bold, color: BLANCO });
  c.y -= hBar + 10;

  // --- Bloques informativos (fondo claro + borde navy + círculo numerado) ---
  const bloques = [
    "La presente información se organiza con el propósito de dejar constancia del estado actual del Grupo de Alabanza, su personal, grupos de voces, rotación y equipos de sonido.",
    "Esta entrega deja constancia de la organización y el estado actual del Grupo de Alabanza, con el propósito de facilitar la continuidad del ministerio y servir como referencia para quienes continúen con esta responsabilidad.",
  ];
  for (let bi = 0; bi < bloques.length; bi++) {
    const lineas = envolver(c.font, bloques[bi], 10, ancho - 84);
    const hBlock = lineas.length * 14 + 28;
    if (c.y - hBlock < 70) await nueva(c);
    const yTop = c.y;
    p.drawRectangle({ x: M, y: yTop - hBlock, width: ancho, height: hBlock, color: LIGHT, borderColor: NAVY, borderWidth: 1 });
    // Círculo navy con número blanco
    const ccx = M + 30, ccy = yTop - hBlock / 2;
    p.drawCircle({ x: ccx, y: ccy, size: 14, color: NAVY });
    const num = String(bi + 1);
    p.drawText(num, { x: ccx - c.bold.widthOfTextAtSize(num, 11) / 2, y: ccy - 4, size: 11, font: c.bold, color: BLANCO });
    lineas.forEach((ln, li) => {
      p.drawText(ln, { x: M + 54, y: yTop - 20 - li * 14, size: 10, font: c.font, color: rgb(0.15, 0.18, 0.28) });
    });
    c.y -= hBlock + 10;
  }

  // --- Bloque firma (dinámica de Ajustes) ---
  const nombre = firmaNombre();
  const cargo = firmaCargo();
  const hFirma = 74;
  if (c.y - hFirma < 90) await nueva(c);
  const yTopF = c.y;
  p.drawRectangle({ x: M, y: yTopF - hFirma, width: ancho, height: hFirma, color: LIGHT, borderColor: NAVY, borderWidth: 1 });
  p.drawCircle({ x: M + 30, y: yTopF - hFirma / 2, size: 14, color: NAVY });
  // Inicial del nombre dentro del círculo
  const inicial = (nombre.trim()[0] || "E").toUpperCase();
  p.drawText(inicial, { x: M + 30 - c.bold.widthOfTextAtSize(inicial, 11) / 2, y: yTopF - hFirma / 2 - 4, size: 11, font: c.bold, color: BLANCO });
  p.drawText("ENTREGADO POR:", { x: M + 54, y: yTopF - 24, size: 9, font: c.font, color: GRAY });
  p.drawText(nombre, { x: M + 54, y: yTopF - 46, size: 17, font: c.bold, color: NAVY });
  p.drawText(cargo, { x: M + 54, y: yTopF - 62, size: 10, font: c.font, color: GRAY });
  c.y -= hFirma + 16;

  // --- Líneas recibido + fecha ---
  if (c.y < 110) await nueva(c);
  p.drawText("Recibido por: ____________________     Firma: __________", { x: M, y: c.y, size: 10, font: c.font });
  c.y -= 20;
  p.drawText(`Fecha de entrega: ${fechaHora()}`, { x: M, y: c.y, size: 10, font: c.font, color: GRAY });
  c.y -= 6;
  // Regla dorada de cierre
  p.drawLine({ start: { x: M, y: c.y }, end: { x: M + ancho, y: c.y }, thickness: 1.5, color: GOLD });
  c.y -= 4;
}

export async function buildPdf(kind: ReportKind): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const lf = logoFile();
  const logo = lf ? await embedImg(doc, lf) : null;
  const c = newCtx(doc, font, bold, logo, TITULOS[kind]);

  const d = db();
  // ===== SECCIÓN 1 (general): Grupo de Alabanza 2026 — Personal + Grupos + Alcancía =====
  if (kind === "general") await tituloSeccion(c, "1. Grupo de Alabanza 2026");
  if (kind === "personal" || kind === "general") {
    if (kind === "general") await titulo2(c, "Personal");
    const ints = d.prepare("SELECT * FROM integrantes ORDER BY nombre").all() as Record<string, unknown>[];
    const rows = ints.map((r) => [
      String(r.nombre), ep(String(r.estado)),
      nombreDe(Number(r.grupo_id)), String(r.rol), String(r.telefono || "—"),
    ]);
    await tabla(c, [{ t: "Nombre", w: 150 }, { t: "Estado", w: 95 }, { t: "Grupo", w: 120 }, { t: "Rol", w: 70 }, { t: "Teléfono", w: 80 }], rows);
  }
  if (kind === "grupos" || kind === "general") {
    if (kind === "general") await titulo2(c, "Grupos de voces");
    else await titulo2(c, "Integrantes por grupo");
    // Una sola tabla de 3 columnas: el grupo abarca las filas de sus integrantes
    const gs = d.prepare("SELECT * FROM grupos_voz ORDER BY nombre").all() as { id: number; nombre: string }[];
    await tablaGrupos(c, gs);
    await titulo2(c, "Rotación semanal");
    const rot = d.prepare("SELECT dia, grupo_id FROM rotacion ORDER BY orden").all() as { dia: string; grupo_id: number }[];
    await tabla(c, [{ t: "Día / servicio", w: 200 }, { t: "Grupo", w: 315 }], rot.map((r) => [r.dia, nombreDe(r.grupo_id)]));
    c.y -= 10; // aire: la nota no va pegada a la última fila
    await parrafo(c, "Nota: el grupo del domingo en la noche repite el martes.");
  }
  if (kind === "alcancia" || kind === "general") {
    if (kind === "general") await titulo2(c, "Alcancía / voto");
    const rows = d.prepare(
      `SELECT i.nombre, a.dio, a.monto, COALESCE(a.sellada,0) AS sellada FROM integrantes i LEFT JOIN alcancia a ON a.integrante_id=i.id
       WHERE i.estado IN ('ACTIVO','ASISTENTE','DISPONIBLE') ORDER BY i.nombre`).all() as { nombre: string; dio: number; monto: number; sellada: number }[];
    const celdaMonto = (r: { dio: number; monto: number; sellada: number }) =>
      !r.dio ? "—" : r.sellada ? "Sellada" : r.monto > 0 ? fmtCOP(r.monto) : "Dio";
    await tabla(c, [{ t: "Integrante", w: 300 }, { t: "Estado", w: 100 }, { t: "Monto", w: 115 }],
      rows.map((r) => [r.nombre, r.dio ? "Dio" : "Pendiente", celdaMonto(r)]));
    c.y -= 10; // aire: la nota no va pegada a la última celda
    await parrafo(c, `Total recogido: ${fmtCOP(totalRecogido())} · Dieron ${rows.filter((r) => r.dio).length} de ${rows.length}.`);
  }
  if (kind === "equipos" || kind === "general") {
    // Una hoja por unidad (lógica de ficha, breve): foto centrada + datos concisos
    const eqs = d.prepare("SELECT * FROM equipos ORDER BY tipo, numero").all() as Record<string, unknown>[];
    const enUso = eqs.filter((e) => e.estado === "EN_USO").length;
    // Cada unidad en su propia hoja. En el general, el título y totales
    // van SOLO en la primera hoja de inventario (las demás, limpias).
    let primeraUnidad = true;
    for (const e of eqs) {
      // En el general, hoja fresca ANTES del título: título + 1ra unidad juntos
      if (!primeraUnidad || kind === "general") await nueva(c);
      if (kind === "general" && primeraUnidad) {
        await tituloSeccion(c, `2. Inventario (${eqs.length} unidades, una por hoja)`);
        c.y -= 8; // <br> suave entre título y totales (ni pegado ni brusco)
        await parrafo(c, `Total: ${eqs.length} unidades · En uso: ${enUso}.`);
        c.y -= 4;
      }
      primeraUnidad = false;
      await contenidoFichaEquipo(c, doc, e);
    }
    if (kind === "equipos") {
      c.y -= 14; // aire antes de las notas finales
      await parrafo(c, `Total: ${eqs.length} unidades · En uso: ${enUso}.`);
      c.y -= 6;
      await parrafo(c, "Fin del inventario.");
    }
  }
  if (kind === "general") {
    await seccionActaEntrega(c);
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
  const c = newCtx(doc, font, bold, logo, nombre);
  const d = db();
  if (tipo === "integrante") {
    const r = d.prepare("SELECT * FROM integrantes WHERE id=?").get(id) as Record<string, unknown> | undefined;
    if (!r) throw new Error("No existe");
    const fotoRel = r.foto ? String(r.foto) : null;
    const fotoFull = fotoRel && existsSync(join(DATA_DIR, fotoRel)) ? join(DATA_DIR, fotoRel) : null;
    if (fotoFull) {
      const img = await embedImg(doc, fotoFull);
      if (img) {
        const sc = Math.min(200 / img.width, 200 / img.height);
        const w = img.width * sc, h = img.height * sc;
        const x = (c.pgW - w) / 2;
        c.page.drawRectangle({ x: x - 4, y: c.y - h - 4, width: w + 8, height: h + 8, borderColor: NAVY, borderWidth: 1 });
        c.page.drawImage(img, { x, y: c.y - h, width: w, height: h });
        c.y -= h + 18;
      }
    }
    await tabla(c, [{ t: "Campo", w: 150 }, { t: "Valor", w: 365 }], [
      ["Nombre", String(r.nombre)], ["Estado", ep(String(r.estado))],
      ["Atributo", r.atributo ? ep(String(r.atributo)) : "—"],
      ["Grupo", nombreDe(Number(r.grupo_id))], ["Rol", String(r.rol) || "—"],
      ["Teléfono", String(r.telefono || "—")], ["Observaciones", String(r.observaciones || "—")],
    ]);
  } else {
    const r = d.prepare("SELECT * FROM equipos WHERE id=?").get(id) as Record<string, unknown> | undefined;
    if (!r) throw new Error("No existe");
    await contenidoFichaEquipo(c, doc, r);
  }
  pie(c);
  return doc.save();
}

function nombreDe(id: number | null): string {
  if (id == null) return "Sin grupo";
  const g = db().prepare("SELECT nombre FROM grupos_voz WHERE id=?").get(id) as { nombre: string } | undefined;
  return g?.nombre ?? "Sin grupo";
}
