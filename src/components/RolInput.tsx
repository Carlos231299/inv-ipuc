"use client";
import { useEffect, useState } from "react";
import { ROLES_VOZ } from "@/lib/cargos";

// Selector de rol con opción "Otro" que despliega campo libre.
// Acepta valores ya guardados fuera de la lista (los trata como Otro).
// Con `conBoton`, los cambios quedan pendientes hasta pulsar ✓ (no actualiza en tiempo real).
export default function RolInput({ valor, onCambio, conBoton = false }: {
  valor: string; onCambio: (v: string) => void; conBoton?: boolean;
}) {
  const esOtro = !!valor && !ROLES_VOZ.includes(valor);
  const [sel, setSel] = useState(esOtro ? "Otro" : valor);
  const [libre, setLibre] = useState(esOtro ? valor : "");
  const [sucio, setSucio] = useState(false);
  useEffect(() => {
    setSel(esOtro ? "Otro" : valor);
    if (esOtro) setLibre(valor);
    setSucio(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  function borrador(): string {
    return sel === "Otro" ? libre.trim() : sel;
  }
  function elegir(v: string) {
    setSel(v);
    if (v !== "Otro") setLibre("");
    const d = v === "Otro" ? libre.trim() : v;
    setSucio(d !== (valor || ""));
    if (!conBoton) onCambio(d);
  }
  function escribir(v: string) {
    setLibre(v);
    setSucio((sel === "Otro" ? v.trim() : sel) !== (valor || ""));
    if (!conBoton) onCambio(v);
  }
  function confirmar() {
    onCambio(borrador());
    setSucio(false);
  }

  return (
    <div>
      <div className="row">
        <select className="grow" style={{ margin: 0 }} value={sel} onChange={(e) => elegir(e.target.value)}>
          <option value="">— Elegir rol —</option>
          {ROLES_VOZ.map((r) => <option key={r} value={r}>{r}</option>)}
          <option value="Otro">Otro…</option>
        </select>
        {conBoton && sucio ? <button className="btn sm" onClick={confirmar}>✓</button> : null}
      </div>
      {sel === "Otro" ? (
        <input placeholder="¿Cuál? Ej: Piano" value={libre} onChange={(e) => escribir(e.target.value)} />
      ) : null}
    </div>
  );
}
