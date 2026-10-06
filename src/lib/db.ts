import { DatabaseSync } from "node:sqlite";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export const DATA_DIR =
  process.env.DATA_DIR || join(process.cwd(), "data");
mkdirSync(join(DATA_DIR, "fotos"), { recursive: true });
mkdirSync(join(DATA_DIR, "escudo"), { recursive: true });

let _db: DatabaseSync | null = null;

export function db(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(join(DATA_DIR, "alabanza.db"));
    _db.exec("PRAGMA journal_mode = WAL;");
    schema(_db);
    seed(_db);
  }
  return _db;
}

function schema(d: DatabaseSync) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS grupos_voz (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS integrantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, estado TEXT DEFAULT 'ACTIVO',
      grupo_id INTEGER, rol TEXT DEFAULT 'Voz', telefono TEXT DEFAULT '',
      fecha_ingreso TEXT DEFAULT '2026', foto TEXT, observaciones TEXT DEFAULT '');
    CREATE TABLE IF NOT EXISTS alcancia (
      id INTEGER PRIMARY KEY AUTOINCREMENT, integrante_id INTEGER UNIQUE,
      dio INTEGER DEFAULT 0, monto REAL DEFAULT 0, fecha TEXT DEFAULT '');
    CREATE TABLE IF NOT EXISTS equipos (
      id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT NOT NULL, numero INTEGER DEFAULT 1,
      nombre TEXT NOT NULL, estado TEXT DEFAULT 'EN_USO', ubicacion TEXT DEFAULT 'Templo',
      foto TEXT, codigo TEXT DEFAULT '', observaciones TEXT DEFAULT '');
    CREATE TABLE IF NOT EXISTS rotacion (
      id INTEGER PRIMARY KEY AUTOINCREMENT, dia TEXT NOT NULL, grupo_id INTEGER, orden INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS ajustes (clave TEXT PRIMARY KEY, valor TEXT);
    DROP TABLE IF EXISTS lideres;
  `);
  // Evidencias: mínimo 3 fotos por unidad (diferentes ángulos)
  const colsEq = d.prepare("PRAGMA table_info(equipos)").all() as { name: string }[];
  for (const col of ["foto2", "foto3"]) {
    if (!colsEq.some((x) => x.name === col)) d.exec(`ALTER TABLE equipos ADD COLUMN ${col} TEXT`);
  }
}

export type Integrante = {
  id: number; nombre: string; estado: string; grupo_id: number | null;
  rol: string; telefono: string; fecha_ingreso: string; foto: string | null; observaciones: string;
};
export type Grupo = { id: number; nombre: string };
export type Aporte = { id: number; integrante_id: number; dio: number; monto: number; fecha: string };
export type Equipo = {
  id: number; tipo: string; numero: number; nombre: string; estado: string;
  ubicacion: string; foto: string | null; foto2: string | null; foto3: string | null;
  codigo: string; observaciones: string;
};

// Fotos de evidencia de una unidad (mínimo 3, diferentes ángulos)
export function fotosDe(r: { foto?: unknown; foto2?: unknown; foto3?: unknown }): string[] {
  return [r.foto, r.foto2, r.foto3].filter((f): f is string => typeof f === "string" && f.length > 0);
}
export type Rot = { id: number; dia: string; grupo_id: number; orden: number };

export function grupos(): Grupo[] {
  return db().prepare("SELECT * FROM grupos_voz ORDER BY nombre").all() as Grupo[];
}
export function integrantes(): Integrante[] {
  return db().prepare("SELECT * FROM integrantes ORDER BY nombre").all() as Integrante[];
}
export function aportes(): Aporte[] {
  return db().prepare("SELECT * FROM alcancia").all() as Aporte[];
}
export function equipos(): Equipo[] {
  return db().prepare("SELECT * FROM equipos ORDER BY tipo, numero").all() as Equipo[];
}
export function rotacion(): Rot[] {
  return db().prepare("SELECT * FROM rotacion ORDER BY orden").all() as Rot[];
}
export function nombreGrupo(id: number | null): string {
  if (id == null) return "Sin grupo";
  const g = db().prepare("SELECT nombre FROM grupos_voz WHERE id=?").get(id) as { nombre: string } | undefined;
  return g?.nombre ?? "Sin grupo";
}
export function ajuste(clave: string): string | null {
  const r = db().prepare("SELECT valor FROM ajustes WHERE clave=?").get(clave) as { valor: string } | undefined;
  return r?.valor ?? null;
}
export function totalRecogido(): number {
  const r = db().prepare("SELECT COALESCE(SUM(monto),0) AS t FROM alcancia WHERE dio=1").get() as { t: number };
  return r.t;
}

function seed(d: DatabaseSync) {
  const n = (d.prepare("SELECT COUNT(*) AS c FROM integrantes").get() as { c: number }).c;
  if (n > 0) return;

  const insG = d.prepare("INSERT INTO grupos_voz (nombre) VALUES (?)");
  const gLinaje = Number(insG.run("Linaje Escogido").lastInsertRowid);
  const gJubilo = Number(insG.run("Voces de Júbilo").lastInsertRowid);
  const gCelestial = Number(insG.run("Alabanza Celestial").lastInsertRowid);
  const g4 = Number(insG.run("Grupo #4").lastInsertRowid);

  const grupoDe: Record<string, number> = {
    "Ashly Salazar": gLinaje, "Elishaday Vergel": gLinaje, "Rita García": gLinaje,
    "Sandra Mejía": gJubilo, "Martha Dávila": gJubilo, "Keila Ojeda": gJubilo,
    "Daired Acosta": gCelestial, "Janny Chacón": gCelestial, "Gledis Valle": gCelestial,
    "Margarith Salazar": g4, "Dayerlin Chacón": g4,
  };
  const activos = ["Daired Acosta","Cesar Arrieta","Junior Cárdenas","Dayerlin Chacón","Janny Chacón",
    "Martha Dávila","Salem Funes","Rita García","Geiner Julio","Kendris Martínez","Sandra Mejía",
    "Keila Ojeda","Paola Pacheco","Abel Eliel Salazar","Ashly Salazar","Margarith Salazar",
    "Gledis Valle","Elishaday Vergel"];
  const insI = d.prepare(
    "INSERT INTO integrantes (nombre, estado, grupo_id, rol, observaciones) VALUES (?,?,?,?,?)");
  const insA = d.prepare(
    "INSERT INTO alcancia (integrante_id, dio, monto, fecha) VALUES (?,?,?,?)");
  const dieron: Record<string, number> = {
    "Dayerlin Chacón": 0, "Elishaday Vergel": 20000, "Gledis Valle": 0,
    "Keila Ojeda": 0, "Martha Dávila": 0, "Paola Pacheco": 0,
  };
  for (const nombre of activos) {
    const obs = (nombre === "Kendris Martínez" || nombre === "Paola Pacheco")
      ? "Pertenece al Grupo de Alabanza pero no participa en grupos de voces por motivos personales." : "";
    const id = Number(insI.run(nombre, "ACTIVO", grupoDe[nombre] ?? null, "Voz", obs).lastInsertRowid);
    if (nombre in dieron) insA.run(id, 1, dieron[nombre], "2026");
    else insA.run(id, 0, 0, "");
  }
  const noActivos: [string, string][] = [
    ["Gustavo Sandoval","ASISTENTE"],["Wendel Ariza","ASISTENTE"],["Lizney García","DISPONIBLE"],
    ["Jesús David Zuleta","APARTADO"],["Mayerlis Cáceres","INACTIVO_SALUD"],
  ];
  for (const [nombre, estado] of noActivos) {
    insI.run(nombre, estado, null, "Asistente",
      nombre === "Mayerlis Cáceres" ? "No activa por motivos de salud." : "");
  }

  const insR = d.prepare("INSERT INTO rotacion (dia, grupo_id, orden) VALUES (?,?,?)");
  [["Martes",gLinaje],["Jueves",gJubilo],["Sábado",gCelestial],["Domingo mañana",g4],["Domingo noche",gLinaje]]
    .forEach(([dia, gid], i) => insR.run(dia as string, gid as number, i));

  const insE = d.prepare(
    "INSERT INTO equipos (tipo, numero, nombre, estado, ubicacion, codigo, observaciones) VALUES (?,?,?,?,?,?,?)");
  const lista: [string, number, string, string, string, string, string][] = [
    ["Parlante activo",1,"Parlante activo #1","EN_USO","Templo","PARL-01",""],
    ["Parlante activo",2,"Parlante activo #2","EN_USO","Templo","PARL-02",""],
    ["Parlante activo",3,"Parlante activo #3","EN_USO","Templo","PARL-03",""],
    ["Parlante activo",4,"Parlante activo #4","SIN_USO","Bodega","PARL-04","Sin uso"],
    ["Consola",1,"Consola análoga #1","SIN_USO","Bodega","CONS-A-01","Análoga sin uso"],
    ["Consola",2,"Consola digital #1","EN_USO","Templo","CONS-D-01",""],
    ["Micrófonos",1,"Sistema micrófonos #1","EN_USO","Templo","MIC-01","Sistema inalámbrico"],
  ];
  for (const [t, num, nom, est, ubi, cod, obs] of lista) insE.run(t, num, nom, est, ubi, cod, obs);

  void existsSync;
}
