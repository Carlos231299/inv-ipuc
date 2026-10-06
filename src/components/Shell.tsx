"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV = [
  { h: "/", t: "Resumen", i: "🏠" },
  { h: "/personal", t: "Personal", i: "👥" },
  { h: "/grupos", t: "Grupos", i: "🎶" },
  { h: "/alcancia", t: "Alcancía", i: "💰" },
  { h: "/equipos", t: "Equipos", i: "🔊" },
  { h: "/ajustes", t: "Ajustes", i: "⚙️" },
];

export default function Shell({ ruta, children }: { ruta: string; children: React.ReactNode }) {
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/escudo", { method: "GET" }).then((r) => {
      if (r.ok) setLogo(`/api/escudo?v=${Date.now()}`);
    }).catch(() => {});
  }, []);
  return (
    <>
      <div className="topbar">
        <div className="in">
          {logo ? <img className="esc" src={logo} alt="Escudo" /> : null}
          <div>
            <h1>Grupo de Alabanza 2026</h1>
            <small>IPUC 19, Maicao — Altos del Parrantial</small>
          </div>
          <a className="out" href="/api/auth/logout">Salir</a>
        </div>
      </div>
      <nav className="topnav">
        {NAV.map((n) => (
          <Link key={n.h} href={n.h} className={ruta === n.h ? "on" : ""}>{n.i} {n.t}</Link>
        ))}
      </nav>
      <div className="wrap">{children}</div>
      <nav className="nav">
        {NAV.map((n) => (
          <Link key={n.h} href={n.h} className={ruta === n.h ? "on" : ""}>
            <span className="i">{n.i}</span>{n.t}
          </Link>
        ))}
      </nav>
    </>
  );
}
