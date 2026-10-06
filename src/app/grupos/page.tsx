"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";

type G = { id: number; nombre: string; miembros: { nombre: string; rol: string }[] };
type R = { dia: string; grupo: string };

export default function Grupos() {
  const [gs, setGs] = useState<G[]>([]);
  const [sin, setSin] = useState<{ nombre: string; observaciones: string }[]>([]);
  const [rot, setRot] = useState<R[]>([]);
  useEffect(() => {
    fetch("/api/grupos").then((x) => x.json()).then((j) => { setGs(j.grupos); setSin(j.sinGrupo); setRot(j.rotacion); });
  }, []);
  return (
    <Shell ruta="/grupos">
      <h2>🎶 Alabanza — Grupos de voces</h2>
      <div className="btnrow">
        <a className="btn sec sm" href="/api/reportes?kind=grupos">PDF grupos + rotación</a>
      </div>
      <div className="cols2">
        {gs.map((g) => (
          <div key={g.id} className="card">
            <div className="t">{g.nombre} <span className="chip">{g.miembros.length}</span></div>
            {g.miembros.map((m) => <div key={m.nombre} className="s">• {m.nombre} — {m.rol}</div>)}
            {!g.miembros.length ? <div className="s">Sin integrantes</div> : null}
          </div>
        ))}
      </div>
      <div className="card">
        <div className="t">Sin grupo (casos personales)</div>
        {sin.map((m) => <div key={m.nombre} className="s">• {m.nombre} — {m.observaciones}</div>)}
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
