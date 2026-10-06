"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import FotoInput from "@/components/FotoInput";
import { ep, fmtCOP } from "@/lib/etiquetas";

type F = { id: number; nombre: string; estado: string; grupo_id: number | null; grupo: string; rol: string; telefono: string; foto: string | null; observaciones: string; dio: number; monto: number };
const EST = ["ACTIVO", "ASISTENTE", "DISPONIBLE", "APARTADO", "INACTIVO_SALUD"];
const ROLES = ["Voz", "Músico", "Sonido", "Líder", "Asistente"];

const VACIO = { id: 0, nombre: "", estado: "ACTIVO", grupo_id: null as number | null, grupo: "", rol: "Voz", telefono: "", foto: null as string | null, observaciones: "", dio: 0, monto: 0 };

export default function Personal() {
  const [lista, setLista] = useState<F[]>([]);
  const [grupos, setGrupos] = useState<{ id: number; nombre: string }[]>([]);
  const [q, setQ] = useState("");
  const [f, setF] = useState("TODOS");
  const [ed, setEd] = useState<typeof VACIO | null>(null);

  async function cargar() {
    const r = await fetch("/api/integrantes").then((x) => x.json());
    setLista(r);
    const g = await fetch("/api/grupos").then((x) => x.json());
    setGrupos(g.grupos.map((x: { id: number; nombre: string }) => ({ id: x.id, nombre: x.nombre })));
  }
  useEffect(() => { cargar(); }, []);

  const fil = lista.filter((i) => (f === "TODOS" || i.estado === f) && i.nombre.toLowerCase().includes(q.toLowerCase()));

  async function guardar() {
    if (!ed || !ed.nombre.trim()) return;
    const m = ed.id === 0 ? "POST" : "PUT";
    await fetch("/api/integrantes", { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...ed, dio: !!ed.dio, monto: Number(ed.monto) || 0 }) });
    setEd(null); cargar();
  }
  async function borrar(id: number) {
    if (!confirm("¿Eliminar integrante?")) return;
    await fetch(`/api/integrantes?id=${id}`, { method: "DELETE" });
    cargar();
  }

  return (
    <Shell ruta="/personal">
      <h2>👥 Personal</h2>
      <input className="search" placeholder="Buscar integrante…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="filters">
        {["TODOS", ...EST].map((e) => <button key={e} className={f === e ? "on" : ""} onClick={() => setF(e)}>{e === "TODOS" ? "Todos" : ep(e)}</button>)}
      </div>
      <div className="btnrow">
        <button className="btn sm" onClick={() => setEd({ ...VACIO })}>+ Nuevo</button>
        <a className="btn sec sm" href="/api/reportes?kind=personal">PDF general</a>
        <a className="btn sec sm" href="/api/reportes?kind=personal&format=csv">CSV</a>
      </div>
      <p className="mut">{fil.length} personas</p>

      {ed ? (
        <div className="card">
          <h3>{ed.id === 0 ? "Nuevo integrante" : "Editar integrante"}</h3>
          <FotoInput valor={ed.foto} onFoto={(x) => setEd({ ...ed, foto: x })} />
          <label>Nombre *</label>
          <input value={ed.nombre} onChange={(e) => setEd({ ...ed, nombre: e.target.value })} />
          <div className="row">
            <div className="grow"><label>Estado</label>
              <select value={ed.estado} onChange={(e) => setEd({ ...ed, estado: e.target.value })}>
                {EST.map((e) => <option key={e} value={e}>{ep(e)}</option>)}
              </select></div>
            <div className="grow"><label>Rol</label>
              <select value={ed.rol} onChange={(e) => setEd({ ...ed, rol: e.target.value })}>
                {ROLES.map((e) => <option key={e}>{e}</option>)}
              </select></div>
          </div>
          <label>Grupo de voz</label>
          <select value={ed.grupo_id ?? ""} onChange={(e) => setEd({ ...ed, grupo_id: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Sin grupo</option>
            {grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
          <label>Teléfono</label>
          <input value={ed.telefono} onChange={(e) => setEd({ ...ed, telefono: e.target.value })} inputMode="tel" />
          <label>Observaciones</label>
          <input value={ed.observaciones} onChange={(e) => setEd({ ...ed, observaciones: e.target.value })} />
          <div className="row">
            <label className="row" style={{ gap: 6 }}><input type="checkbox" style={{ width: 20 }} checked={!!ed.dio} onChange={(e) => setEd({ ...ed, dio: e.target.checked ? 1 : 0 })} /> Ya dio alcancía</label>
            <div className="grow"><label>Monto $</label>
              <input value={ed.monto} onChange={(e) => setEd({ ...ed, monto: Number(e.target.value) || 0 })} inputMode="numeric" /></div>
          </div>
          <div className="btnrow">
            <button className="btn sm" onClick={guardar}>Guardar</button>
            <button className="btn sec sm" onClick={() => setEd(null)}>Cancelar</button>
          </div>
        </div>
      ) : null}

      {fil.map((i) => (
        <div key={i.id} className="card item">
          {i.foto ? <img className="foto" src={`/api/fotos?f=${encodeURIComponent(i.foto)}`} alt="" /> : <div className="ph">👤</div>}
          <div className="grow">
            <div className="t">{i.nombre}</div>
            <div className="s">{ep(i.estado)} · {i.grupo} · {i.rol}</div>
            {i.telefono ? <div className="s">Tel: {i.telefono}</div> : null}
            <div className="s">{i.dio ? `Alcancía: ${fmtCOP(i.monto)} ✅` : "Alcancía: pendiente ❌"}</div>
            <div className="btnrow">
              <button className="btn sec sm" onClick={() => setEd({ ...i })}>Editar</button>
              <a className="btn sec sm" href={`/api/reportes?kind=ficha-integrante&id=${i.id}`}>PDF</a>
              <button className="btn dan sm" onClick={() => borrar(i.id)}>Borrar</button>
            </div>
          </div>
        </div>
      ))}
    </Shell>
  );
}
