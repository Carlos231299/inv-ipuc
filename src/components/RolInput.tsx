"use client";
import { useEffect, useState } from "react";
import { ROLES_VOZ } from "@/lib/cargos";

// Selector de rol con opción "Otro" que despliega campo libre.
// Acepta valores ya guardados fuera de la lista (los trata como Otro).
export default function RolInput({ valor, onCambio }: { valor: string; onCambio: (v: string) => void }) {
  const esOtro = !!valor && !ROLES_VOZ.includes(valor);
  const [sel, setSel] = useState(esOtro ? "Otro" : valor);
  const [libre, setLibre] = useState(esOtro ? valor : "");
  useEffect(() => {
    setSel(esOtro ? "Otro" : valor);
    if (esOtro) setLibre(valor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);
  return (
    <div>
      <select value={sel} onChange={(e) => {
        const v = e.target.value;
        setSel(v);
        if (v !== "Otro") { setLibre(""); onCambio(v); }
        else onCambio(libre);
      }}>
        <option value="">— Elegir rol —</option>
        {ROLES_VOZ.map((r) => <option key={r} value={r}>{r}</option>)}
        <option value="Otro">Otro…</option>
      </select>
      {sel === "Otro" ? (
        <input placeholder="¿Cuál? Ej: Piano" value={libre}
          onChange={(e) => { setLibre(e.target.value); onCambio(e.target.value); }} />
      ) : null}
    </div>
  );
}
