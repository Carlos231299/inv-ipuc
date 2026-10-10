"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { fmtCOP } from "@/lib/etiquetas";
import { confirmar, exito } from "@/lib/alertas";

const V = Date.now(); // cache-buster PDFs

type F = { id: number; nombre: string; dio: number; monto: number; sellada: number };

function chipAporte(i: F) {
  if (!i.dio) return <span className="chip warn">Pendiente</span>;
  if (i.sellada) return <span className="chip ok">Sellada 🔒</span>;
  if (i.monto > 0) return <span className="chip ok">Dio {fmtCOP(i.monto)}</span>;
  return <span className="chip ok">Dio ✅</span>;
}

export default function Alcancia() {
  const [lista, setLista] = useState<F[]>([]);
  const [total, setTotal] = useState(0);
  const [montos, setMontos] = useState<Record<number, string>>({});
  const [selladas, setSelladas] = useState<Record<number, boolean>>({});
  async function cargar() {
    const j = await fetch("/api/alcancia").then((x) => x.json());
    setLista(j.lista); setTotal(j.total);
  }
  useEffect(() => { cargar(); }, []);
  async function marcar(id: number, nombre: string, dio: boolean, monto: number, sellada: boolean) {
    if (dio) {
      const detalle = sellada ? "alcancía sellada" : fmtCOP(monto);
      if (!await confirmar(`¿${nombre} dio ${detalle}?`, "Quedará registrado como aporte visible.")) return;
    }
    await fetch("/api/alcancia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ integrante_id: id, dio, monto: sellada ? 0 : monto, sellada }) });
    cargar();
    exito(dio ? "Aporte registrado" : "Marcado pendiente");
  }
  const dieron = lista.filter((x) => x.dio).length;
  return (
    <Shell ruta="/alcancia">
      <h2>💰 Alcancía / voto</h2>
      <p className="mut">Contribución voluntaria · montos visibles · Total: <b>{fmtCOP(total)}</b> · Dieron {dieron}/{lista.length}</p>
      <div className="btnrow">
        <a className="btn sec sm" href={`/api/reportes?kind=alcancia&v=${V}`}>PDF general</a>
      </div>
      {lista.map((i) => {
        const esSellada = selladas[i.id] ?? !!i.sellada;
        return (
          <div key={i.id} className="card">
            <div className="row">
              <div className="grow"><div className="t">{i.nombre}</div>
                <div className="s">{chipAporte(i)}</div></div>
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <input style={{ margin: 0 }} placeholder="Monto $" disabled={esSellada}
                value={esSellada ? "" : (montos[i.id] ?? (i.monto > 0 ? String(i.monto) : ""))}
                onChange={(e) => setMontos({ ...montos, [i.id]: e.target.value })} inputMode="numeric" />
              <button className="btn sm" onClick={() => marcar(i.id, i.nombre, true, Number(montos[i.id]) || i.monto || 0, esSellada)}>Dio</button>
              <button className="btn sec sm" onClick={() => marcar(i.id, i.nombre, false, 0, false)}>Pend.</button>
            </div>
            <label className="row" style={{ gap: 6, marginTop: 6 }}>
              <input type="checkbox" style={{ width: 20 }} checked={esSellada}
                onChange={(e) => setSelladas({ ...selladas, [i.id]: e.target.checked })} />
              Alcancía sellada (sin monto visible)
            </label>
          </div>
        );
      })}
    </Shell>
  );
}


