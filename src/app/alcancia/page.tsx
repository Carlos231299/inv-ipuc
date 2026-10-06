"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { fmtCOP } from "@/lib/etiquetas";

const V = Date.now(); // cache-buster PDFs

type F = { id: number; nombre: string; dio: number; monto: number };

export default function Alcancia() {
  const [lista, setLista] = useState<F[]>([]);
  const [total, setTotal] = useState(0);
  const [montos, setMontos] = useState<Record<number, string>>({});
  async function cargar() {
    const j = await fetch("/api/alcancia").then((x) => x.json());
    setLista(j.lista); setTotal(j.total);
  }
  useEffect(() => { cargar(); }, []);
  async function marcar(id: number, dio: boolean, monto: number) {
    await fetch("/api/alcancia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ integrante_id: id, dio, monto }) });
    cargar();
  }
  const dieron = lista.filter((x) => x.dio).length;
  return (
    <Shell ruta="/alcancia">
      <h2>💰 Alcancía / voto</h2>
      <p className="mut">Contribución voluntaria · montos visibles · Total: <b>{fmtCOP(total)}</b> · Dieron {dieron}/{lista.length}</p>
      <div className="btnrow">
        <a className="btn sec sm" href={`/api/reportes?kind=alcancia&v=${V}&v=${V}`}>PDF general</a>
      </div>
      {lista.map((i) => (
        <div key={i.id} className="card">
          <div className="row">
            <div className="grow"><div className="t">{i.nombre}</div>
              <div className="s">{i.dio ? <span className="chip ok">Dio {fmtCOP(i.monto)}</span> : <span className="chip warn">Pendiente</span>}</div></div>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <input style={{ margin: 0 }} placeholder="Monto $"
              value={montos[i.id] ?? (i.monto > 0 ? String(i.monto) : "")}
              onChange={(e) => setMontos({ ...montos, [i.id]: e.target.value })} inputMode="numeric" />
            <button className="btn sm" onClick={() => marcar(i.id, true, Number(montos[i.id]) || i.monto || 0)}>Dio</button>
            <button className="btn sec sm" onClick={() => marcar(i.id, false, 0)}>Pend.</button>
          </div>
        </div>
      ))}
    </Shell>
  );
}

