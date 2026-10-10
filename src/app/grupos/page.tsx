"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import RolInput from "@/components/RolInput";
import { confirmar, exito, fallar, pedirMotivo } from "@/lib/alertas";

const V = Date.now(); // cache-buster PDFs

type M = { id: number; nombre: string; rol: string; estado: string; observaciones: string };
type G = { id: number; nombre: string; miembros: M[] };
type R = { dia: string; grupo: string };
type P = { id: number; nombre: string; grupo_id: number | null; rol: string };

async function ficha(id: number) {
  const lista = await fetch("/api/integrantes").then((x) => x.json());
  return lista.find((x: { id: number }) => x.id === id) ?? null;
}

export default function Grupos() {
  const [gs, setGs] = useState<G[]>([]);
  const [sin, setSin] = useState<M[]>([]);
  const [rot, setRot] = useState<R[]>([]);
  const [nuevo, setNuevo] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [obsEd, setObsEd] = useState<Record<number, string>>({});
  // Modo editar por grupo: muestra +Agregar y controles por miembro
  const [modoEd, setModoEd] = useState<number | null>(null);
  const [agregando, setAgregando] = useState<number | null>(null);
  const [personal, setPersonal] = useState<P[]>([]);
  const [qAdd, setQAdd] = useState("");

  async function cargar() {
    const j = await fetch("/api/grupos").then((x) => x.json());
    setGs(j.grupos); setSin(j.sinGrupo); setRot(j.rotacion);
  }
  useEffect(() => { cargar(); }, []);

  async function crear() {
    if (!nuevo.trim()) return;
    const r = await fetch("/api/grupos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: nuevo }) });
    if (!r.ok) { fallar("No se pudo crear el grupo."); return; }
    setNuevo(""); cargar();
    exito("Grupo creado");
  }
  async function renombrar(id: number) {
    if (!editNombre.trim()) return;
    await fetch("/api/grupos", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, nombre: editNombre }) });
    setEditId(null); cargar();
    exito("Grupo actualizado");
  }
  async function borrar(id: number, nombre: string, n: number) {
    if (!await confirmar(`¿Eliminar "${nombre}"?`, `Sus ${n} integrantes pasarán a Sin grupo y se quita de la rotación.`, "Sí, eliminar")) return;
    await fetch(`/api/grupos?id=${id}`, { method: "DELETE" });
    cargar();
    exito("Grupo eliminado");
  }

  async function guardarMiembro(id: number, cambios: Partial<{ rol: string; grupo_id: number | null; observaciones: string }>) {
    const m = await ficha(id);
    if (!m) return false;
    const r = await fetch("/api/integrantes", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...m, ...cambios }),
    });
    if (!r.ok) { fallar("No se pudo guardar."); return false; }
    cargar();
    return true;
  }

  async function cambiarRol(id: number, rol: string) {
    if (await guardarMiembro(id, { rol })) exito("Rol actualizado");
  }
  async function mover(id: number, nombre: string, v: string) {
    const gid = v === "" ? null : Number(v);
    if (gid === null) {
      const motivo = await pedirMotivo(nombre);
      if (motivo === null) return;
      if (await guardarMiembro(id, { grupo_id: null, observaciones: motivo })) exito("Pasó a Sin grupo");
      return;
    }
    if (!await confirmar("¿Mover de grupo?", `${nombre} pasará a ${gs.find((g) => g.id === gid)?.nombre}.`)) return;
    if (await guardarMiembro(id, { grupo_id: gid })) exito("Miembro movido");
  }
  async function sacar(id: number, nombre: string) {
    const motivo = await pedirMotivo(nombre);
    if (motivo === null) return;
    if (await guardarMiembro(id, { grupo_id: null, observaciones: motivo })) exito("Pasó a Sin grupo");
  }
  async function abrirAgregar(gid: number) {
    setAgregando(gid); setQAdd("");
    setPersonal(await fetch("/api/integrantes").then((x) => x.json()));
  }
  async function agregar(id: number, nombre: string, gid: number) {
    if (await guardarMiembro(id, { grupo_id: gid })) {
      exito(`${nombre} ahora está en el grupo`);
      setPersonal(await fetch("/api/integrantes").then((x) => x.json()));
    }
  }
  async function guardarObs(id: number) {
    const m = await ficha(id);
    if (!m) return;
    await fetch("/api/integrantes", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...m, observaciones: obsEd[id] ?? "" }),
    });
    cargar();
    exito("Motivo guardado");
  }

  return (
    <Shell ruta="/grupos">
      <h2>🎶 Alabanza — Grupos de voces</h2>
      <div className="btnrow">
        <a className="btn sec sm" href={`/api/reportes?kind=grupos&v=${V}`}>PDF grupos + rotación</a>
      </div>

      <div className="card">
        <div className="t">+ Nuevo grupo</div>
        <div className="row">
          <input className="grow" style={{ margin: 0 }} placeholder="Nombre del grupo…" value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
          <button className="btn sm" onClick={crear}>Crear</button>
        </div>
      </div>

      <div className="cols2">
        {gs.map((g) => {
          const editando = modoEd === g.id;
          const candidatos = personal.filter((p) => p.grupo_id !== g.id && p.nombre.toLowerCase().includes(qAdd.toLowerCase()));
          return (
            <div key={g.id} className="card">
              {editId === g.id ? (
                <div className="row">
                  <input className="grow" style={{ margin: 0 }} value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
                  <button className="btn sm" onClick={() => renombrar(g.id)}>OK</button>
                  <button className="btn sec sm" onClick={() => setEditId(null)}>X</button>
                </div>
              ) : (
                <div className="row">
                  <div className="t grow">{g.nombre} <span className="chip">{g.miembros.length}</span></div>
                  <button className="btn sec sm" onClick={() => { setEditId(g.id); setEditNombre(g.nombre); }}>✏️</button>
                  <button className="btn dan sm" onClick={() => borrar(g.id, g.nombre, g.miembros.length)}>🗑</button>
                </div>
              )}
              <div className="btnrow" style={{ margin: "6px 0 0" }}>
                <button className="btn sec sm" onClick={() => { setModoEd(editando ? null : g.id); setAgregando(null); }}>
                  {editando ? "Terminar edición" : "Editar miembros"}
                </button>
                {editando ? <button className="btn sm" onClick={() => abrirAgregar(g.id)}>+ Agregar</button> : null}
              </div>

              {editando && agregando === g.id ? (
                <div className="card" style={{ margin: "8px 0 0" }}>
                  <div className="t">Agregar a {g.nombre}</div>
                  <input placeholder="Buscar personal…" value={qAdd} onChange={(e) => setQAdd(e.target.value)} />
                  {candidatos.slice(0, 12).map((p) => (
                    <div key={p.id} className="row" style={{ padding: "4px 0" }}>
                      <span className="s grow">{p.nombre}</span>
                      <button className="btn sm" onClick={() => agregar(p.id, p.nombre, g.id)}>Añadir</button>
                    </div>
                  ))}
                  {!candidatos.length ? <div className="s">Sin coincidencias.</div> : null}
                </div>
              ) : null}

              {g.miembros.map((m) => (
                <div key={m.id} style={{ marginTop: 8 }}>
                  <div className="s">• <b>{m.nombre}</b> — {m.rol || "Por asignar"}</div>
                  {editando ? (
                    <>
                      <label>Rol</label>
                      <RolInput valor={m.rol} conBoton onCambio={(v) => cambiarRol(m.id, v)} />
                      <div className="row">
                        <select style={{ margin: 0 }} value={g.id} onChange={(e) => mover(m.id, m.nombre, e.target.value)}>
                          {gs.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                          <option value="">Sacar (Sin grupo)</option>
                        </select>
                        <button className="btn dan sm" onClick={() => sacar(m.id, m.nombre)}>Sacar</button>
                      </div>
                    </>
                  ) : null}
                </div>
              ))}
              {!g.miembros.length ? <div className="s">Sin integrantes</div> : null}
            </div>
          );
        })}
      </div>

      <div className="card accent">
        <div className="t">Sin grupo <span className="chip warn">{sin.length}</span></div>
        <p className="mut">Casos personales: aquí editas el motivo y los puedes devolver a un grupo.</p>
        {sin.map((m) => (
          <div key={m.id} style={{ marginTop: 8 }}>
            <div className="s">• <b>{m.nombre}</b> — {m.rol || "Por asignar"}</div>
            <div className="row">
              <select style={{ margin: 0 }} value="" onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                mover(m.id, m.nombre, v);
              }}>
                <option value="">Mover a grupo…</option>
                {gs.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
              </select>
            </div>
            <label>Motivo / observaciones</label>
            <div className="row">
              <input className="grow" style={{ margin: 0 }} placeholder="Ej: no participa por motivos personales…"
                value={obsEd[m.id] ?? m.observaciones} onChange={(e) => setObsEd({ ...obsEd, [m.id]: e.target.value })} />
              <button className="btn sm" onClick={() => guardarObs(m.id)}>💾</button>
            </div>
          </div>
        ))}
        {!sin.length ? <div className="s">Nadie sin grupo.</div> : null}
      </div>

      <div className="card">
        <div className="t">📅 Rotación semanal</div>
        {rot.map((r) => <div key={r.dia} className="s">• <b>{r.dia}:</b> {r.grupo}</div>)}
        <p className="mut">El grupo del domingo en la noche repite el martes.</p>
      </div>
    </Shell>
  );
}
