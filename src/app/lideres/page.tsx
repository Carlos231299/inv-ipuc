"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import FotoInput from "@/components/FotoInput";
import { MINISTERIOS, CARGOS_TODOS } from "@/lib/cargos";

type L = { id: number; nombre: string; ministerio: string; cargo: string; telefono: string; foto: string | null; observaciones: string };
const VACIO: L = { id: 0, nombre: "", ministerio: "Alabanza", cargo: "Líder de Música", telefono: "", foto: null, observaciones: "" };

export default function Lideres() {
  const [lista, setLista] = useState<L[]>([]);
  const [ed, setEd] = useState<L | null>(null);

  async function cargar() { setLista(await fetch("/api/lideres").then((x) => x.json())); }
  useEffect(() => { cargar(); }, []);

  async function guardar() {
    if (!ed || !ed.nombre.trim()) return;
    await fetch("/api/lideres", {
      method: ed.id === 0 ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(ed),
    });
    setEd(null); cargar();
  }
  async function borrar(id: number, nombre: string) {
    if (!confirm(`¿Eliminar a ${nombre} del liderazgo?`)) return;
    await fetch(`/api/lideres?id=${id}`, { method: "DELETE" });
    cargar();
  }

  return (
    <Shell ruta="/lideres">
      <h2>🤝 Líderes por ministerio</h2>
      <p className="mut">Elegidos o nombrados para cada ministerio de la iglesia local.</p>
      <div className="btnrow">
        <button className="btn sm" onClick={() => setEd({ ...VACIO })}>+ Nuevo líder</button>
        <a className="btn sec sm" href="/api/reportes?kind=lideres">PDF liderazgo</a>
      </div>

      {ed ? (
        <div className="card accent">
          <h3>{ed.id === 0 ? "Nuevo líder" : "Editar líder"}</h3>
          <FotoInput valor={ed.foto} onFoto={(x) => setEd({ ...ed, foto: x })} />
          <label>Nombre *</label>
          <input value={ed.nombre} onChange={(e) => setEd({ ...ed, nombre: e.target.value })} />
          <label>Ministerio</label>
          <select value={ed.ministerio} onChange={(e) => setEd({ ...ed, ministerio: e.target.value })}>
            {MINISTERIOS.map((m) => <option key={m.nombre} value={m.nombre}>{m.nombre}</option>)}
          </select>
          <label>Cargo</label>
          <select value={ed.cargo} onChange={(e) => setEd({ ...ed, cargo: e.target.value })}>
            <option value="">— Elegir —</option>
            {CARGOS_TODOS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label>Teléfono</label>
          <input value={ed.telefono} onChange={(e) => setEd({ ...ed, telefono: e.target.value })} inputMode="tel" />
          <label>Observaciones</label>
          <input value={ed.observaciones} onChange={(e) => setEd({ ...ed, observaciones: e.target.value })} />
          <div className="btnrow">
            <button className="btn sm" onClick={guardar}>Guardar</button>
            <button className="btn sec sm" onClick={() => setEd(null)}>Cancelar</button>
          </div>
        </div>
      ) : null}

      <div className="cols2">
        {MINISTERIOS.map((m) => {
          const ms = lista.filter((l) => l.ministerio === m.nombre);
          return (
            <div key={m.nombre} className="card">
              <div className="t">{m.nombre} <span className="chip">{ms.length}</span></div>
              <div className="s">{m.enfoque}</div>
              {ms.map((l) => (
                <div key={l.id} className="card item" style={{ margin: "8px 0 0" }}>
                  {l.foto ? <img className="foto" src={`/api/fotos?f=${encodeURIComponent(l.foto)}`} alt="" /> : <div className="ph">🤝</div>}
                  <div className="grow">
                    <div className="t">{l.nombre}</div>
                    <div className="s">{l.cargo || "—"}{l.telefono ? ` · Tel: ${l.telefono}` : ""}</div>
                    <div className="btnrow" style={{ margin: "6px 0 0" }}>
                      <button className="btn sec sm" onClick={() => setEd({ ...l })}>Editar</button>
                      <button className="btn dan sm" onClick={() => borrar(l.id, l.nombre)}>Borrar</button>
                    </div>
                  </div>
                </div>
              ))}
              {!ms.length ? <div className="s">Sin líderes registrados.</div> : null}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
