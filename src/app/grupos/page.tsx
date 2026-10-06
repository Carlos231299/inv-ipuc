"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";

type M = { id: number; nombre: string; rol: string; estado: string; observaciones: string };
type G = { id: number; nombre: string; miembros: M[] };
type R = { dia: string; grupo: string };

export default function Grupos() {
  const [gs, setGs] = useState<G[]>([]);
  const [sin, setSin] = useState<M[]>([]);
  const [rot, setRot] = useState<R[]>([]);
  const [nuevo, setNuevo] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [obsEd, setObsEd] = useState<Record<number, string>>({});

  async function cargar() {
    const j = await fetch("/api/grupos").then((x) => x.json());
    setGs(j.grupos); setSin(j.sinGrupo); setRot(j.rotacion);
  }
  useEffect(() => { cargar(); }, []);

  async function crear() {
    if (!nuevo.trim()) return;
    await fetch("/api/grupos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: nuevo }) });
    setNuevo(""); cargar();
  }
  async function renombrar(id: number) {
    if (!editNombre.trim()) return;
    await fetch("/api/grupos", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, nombre: editNombre }) });
    setEditId(null); cargar();
  }
  async function borrar(id: number, nombre: string, n: number) {
    if (!confirm(`¿Eliminar "${nombre}"? Sus ${n} integrantes pasarán a Sin grupo y se quita de la rotación.`)) return;
    await fetch(`/api/grupos?id=${id}`, { method: "DELETE" });
    cargar();
  }
  // Mueve un miembro de grupo (o a Sin grupo) conservando sus demás datos
  async function mover(id: number, grupoId: number | null) {
    const lista = await fetch("/api/integrantes").then((x) => x.json());
    const m = lista.find((x: { id: number }) => x.id === id);
    if (!m) return;
    await fetch("/api/integrantes", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...m, grupo_id: grupoId }),
    });
    cargar();
  }
  async function guardarObs(id: number) {
    const lista = await fetch("/api/integrantes").then((x) => x.json());
    const m = lista.find((x: { id: number }) => x.id === id);
    if (!m) return;
    await fetch("/api/integrantes", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...m, observaciones: obsEd[id] ?? "" }),
    });
    cargar();
  }

  const moverA = (id: number, v: string) => mover(id, v === "" ? null : Number(v));

  return (
    <Shell ruta="/grupos">
      <h2>🎶 Alabanza — Grupos de voces</h2>
      <div className="btnrow">
        <a className="btn sec sm" href="/api/reportes?kind=grupos">PDF grupos + rotación</a>
      </div>

      <div className="card">
        <div className="t">+ Nuevo grupo</div>
        <div className="row">
          <input className="grow" style={{ margin: 0 }} placeholder="Nombre del grupo…" value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
          <button className="btn sm" onClick={crear}>Crear</button>
        </div>
      </div>

      <div className="cols2">
        {gs.map((g) => (
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
            {g.miembros.map((m) => (
              <div key={m.id} style={{ marginTop: 8 }}>
                <div className="s">• <b>{m.nombre}</b> — {m.rol}</div>
                <div className="row">
                  <select style={{ margin: 0 }} value={g.id} onChange={(e) => moverA(m.id, e.target.value)}>
                    {gs.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                    <option value="">Sin grupo</option>
                  </select>
                </div>
              </div>
            ))}
            {!g.miembros.length ? <div className="s">Sin integrantes</div> : null}
          </div>
        ))}
      </div>

      <div className="card accent">
        <div className="t">Sin grupo <span className="chip warn">{sin.length}</span></div>
        <p className="mut">Casos personales: aquí editas el motivo y los puedes devolver a un grupo.</p>
        {sin.map((m) => (
          <div key={m.id} style={{ marginTop: 8 }}>
            <div className="s">• <b>{m.nombre}</b> — {m.rol}</div>
            <div className="row">
              <select style={{ margin: 0 }} value="" onChange={(e) => moverA(m.id, e.target.value)}>
                <option value="">Sin grupo</option>
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
