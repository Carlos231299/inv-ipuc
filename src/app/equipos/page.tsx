"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import FotoInput from "@/components/FotoInput";
import { eq } from "@/lib/etiquetas";

type E = { id: number; tipo: string; numero: number; nombre: string; estado: string; ubicacion: string; foto: string | null; foto2: string | null; foto3: string | null; codigo: string; observaciones: string };
const EST = ["EN_USO", "SIN_USO", "DAÑADO", "MANTENIMIENTO"];
const VACIO: E = { id: 0, tipo: "Parlante activo", numero: 1, nombre: "", estado: "EN_USO", ubicacion: "Templo", foto: null, foto2: null, foto3: null, codigo: "", observaciones: "" };
const FOTOS_LABEL = ["Foto 1 (frontal)", "Foto 2 (lateral)", "Foto 3 (detalle)"] as const;

export default function Equipos() {
  const [lista, setLista] = useState<E[]>([]);
  const [ed, setEd] = useState<E | null>(null);
  const [err, setErr] = useState("");
  async function cargar() { setLista(await fetch("/api/equipos").then((x) => x.json())); }
  useEffect(() => { cargar(); }, []);
  async function guardar() {
    if (!ed || !ed.tipo.trim()) return;
    const n = [ed.foto, ed.foto2, ed.foto3].filter(Boolean).length;
    if (n < 3) { setErr(`❌ Faltan fotos de evidencia: ${n}/3 (toma de diferentes ángulos).`); return; }
    setErr("");
    const r = await fetch("/api/equipos", {
      method: ed.id === 0 ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ed),
    });
    if (!r.ok) { setErr("❌ No se guardó. Verifica las 3 fotos."); return; }
    setEd(null); cargar();
  }
  async function borrar(id: number) {
    if (!confirm("¿Eliminar unidad?")) return;
    await fetch(`/api/equipos?id=${id}`, { method: "DELETE" });
    cargar();
  }
  const enUso = lista.filter((e) => e.estado === "EN_USO").length;
  return (
    <Shell ruta="/equipos">
      <h2>📦 Inventario de equipos</h2>
      <p className="mut">{lista.length} unidades · {enUso} en uso · cada #n tiene su foto y estado</p>
      <div className="btnrow">
        <button className="btn sm" onClick={() => setEd({ ...VACIO, numero: lista.length + 1 })}>+ Unidad</button>
        <a className="btn sec sm" href="/api/reportes?kind=equipos">PDF general</a>
      </div>
      {ed ? (
        <div className="card">
          <h3>Unidad #{ed.numero || "?"}</h3>
          <p className="mut">📷 Mínimo 3 fotos de diferentes ángulos para ver el estado real.</p>
          {([["foto", FOTOS_LABEL[0]], ["foto2", FOTOS_LABEL[1]], ["foto3", FOTOS_LABEL[2]]] as const).map(([k, label]) => (
            <div key={k}>
              <label>{label}</label>
              <FotoInput valor={ed[k]} onFoto={(x) => { setErr(""); setEd({ ...ed, [k]: x }); }} />
            </div>
          ))}
          {err ? <div className="err">{err}</div> : null}
          <label>Tipo (Parlante activo, Consola, Micrófonos…)</label>
          <input value={ed.tipo} onChange={(e) => setEd({ ...ed, tipo: e.target.value })} />
          <div className="row">
            <div className="grow"><label>Número #</label>
              <input value={ed.numero} onChange={(e) => setEd({ ...ed, numero: Number(e.target.value) || 1 })} inputMode="numeric" /></div>
            <div className="grow"><label>Estado</label>
              <select value={ed.estado} onChange={(e) => setEd({ ...ed, estado: e.target.value })}>
                {EST.map((s) => <option key={s} value={s}>{eq(s)}</option>)}
              </select></div>
          </div>
          <label>Ubicación</label>
          <input value={ed.ubicacion} onChange={(e) => setEd({ ...ed, ubicacion: e.target.value })} />
          <label>Código (PARL-01)</label>
          <input value={ed.codigo} onChange={(e) => setEd({ ...ed, codigo: e.target.value })} />
          <label>Observaciones (sin límite)</label>
          <textarea rows={3} value={ed.observaciones} onChange={(e) => setEd({ ...ed, observaciones: e.target.value })} style={{ resize: "vertical" }} />
          <p className="s">Se guardará como: <b>{ed.tipo || "Equipo"} #{ed.numero}</b></p>
          <div className="btnrow">
            <button className="btn sm" onClick={guardar}>Guardar</button>
            <button className="btn sec sm" onClick={() => setEd(null)}>Cancelar</button>
          </div>
        </div>
      ) : null}
      {lista.map((e) => (
        <div key={e.id} className="card item">
          {e.foto ? <img className="foto" src={`/api/fotos?f=${encodeURIComponent(e.foto)}`} alt="" /> : <div className="ph">🔊</div>}
          <div className="grow">
            <div className="t">{e.nombre}</div>
            <div className="s"><span className={`chip ${e.estado === "EN_USO" ? "ok" : e.estado === "SIN_USO" ? "warn" : "bad"}`}>{eq(e.estado)}</span> · {e.ubicacion} · {e.codigo}</div>
            {e.observaciones ? <div className="s">{e.observaciones}</div> : null}
            <div className="btnrow">
              <button className="btn sec sm" onClick={() => setEd({ ...e })}>Editar</button>
              <a className="btn sec sm" href={`/api/reportes?kind=ficha-equipo&id=${e.id}`}>PDF</a>
              <button className="btn dan sm" onClick={() => borrar(e.id)}>Borrar</button>
            </div>
          </div>
        </div>
      ))}
    </Shell>
  );
}
