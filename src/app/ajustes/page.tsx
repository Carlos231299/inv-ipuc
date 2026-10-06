"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { CARGOS } from "@/lib/cargos";

export default function Ajustes() {
  const [msg, setMsg] = useState("");
  const [v, setV] = useState(0);
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [msgF, setMsgF] = useState("");

  useEffect(() => {
    fetch("/api/ajustes").then((x) => x.json()).then((j) => {
      setNombre(j.firma_nombre || ""); setCargo(j.firma_cargo || "");
    }).catch(() => {});
  }, []);

  async function guardarFirma() {
    if (!nombre.trim() || !cargo) { setMsgF("❌ Completa nombre y cargo."); return; }
    const r = await fetch("/api/ajustes", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firma_nombre: nombre.trim(), firma_cargo: cargo }),
    });
    setMsgF(r.ok ? "✅ Firma actualizada. Saldrá en el pie de los PDFs." : "❌ No se pudo guardar.");
  }
  async function subir(file: File) {
    const fd = new FormData();
    fd.append("escudo", file);
    const r = await fetch("/api/escudo", { method: "POST", body: fd });
    setMsg(r.ok ? "✅ Escudo actualizado. Saldrá pequeño arriba y como marca de agua en los PDFs." : "❌ No se pudo subir (usa PNG o JPG).");
    setV(Date.now());
  }
  return (
    <Shell ruta="/ajustes">
      <h2>⚙️ Ajustes</h2>
      <div className="card">
        <div className="t">Escudo de la iglesia</div>
        <p className="mut">Lo subes una vez. Aparece pequeño en el encabezado de los reportes y grande como marca de agua detrás del contenido.</p>
        <img src={`/api/escudo?v=${v}`} alt="Escudo actual" style={{ maxWidth: 140, display: v || true ? undefined : undefined }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <label style={{ marginTop: 8 }}>Subir escudo (PNG/JPG)</label>
        <input type="file" accept="image/png,image/jpeg,image/webp"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) subir(f); }} />
        {msg ? <p className="mut">{msg}</p> : null}
      </div>
      <div className="card accent">
        <div className="t">✍️ Firma de reportes</div>
        <p className="mut">Nombre y cargo que aparecen al pie de los PDFs y en el acta de entrega.</p>
        <label>Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Gerson Acosta" />
        <label>Cargo (Nivel Local)</label>
        <select value={cargo} onChange={(e) => setCargo(e.target.value)}>
          <option value="">— Elegir cargo —</option>
          {CARGOS.map((g) => (
            <optgroup key={g.grupo} label={g.grupo}>
              {g.cargos.map((c) => <option key={c} value={c}>{c}</option>)}
            </optgroup>
          ))}
        </select>
        <div className="btnrow"><button className="btn sm" onClick={guardarFirma}>Guardar firma</button></div>
        {msgF ? <p className="mut">{msgF}</p> : null}
      </div>
      <div className="card">
        <div className="t">Seguridad</div>
        <p className="mut">Sesión del encargado. Para cambiar la contraseña hay que actualizarla en el servidor (variables de entorno) — avísame y la rotamos.</p>
        <div className="btnrow"><a className="btn sec sm" href="/api/auth/logout">Cerrar sesión</a></div>
      </div>
    </Shell>
  );
}
