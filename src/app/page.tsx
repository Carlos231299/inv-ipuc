import Shell from "@/components/Shell";
import { integrantes, equipos, rotacion, nombreGrupo, totalRecogido, aportes, grupos } from "@/lib/db";
import { ep, eq, fmtCOP } from "@/lib/etiquetas";

export const dynamic = "force-dynamic";

export default function Resumen() {
  const ints = integrantes();
  const act = ints.filter((i) => i.estado === "ACTIVO");
  const noAct = ints.filter((i) => i.estado !== "ACTIVO");
  const eqs = equipos();
  const rot = rotacion();
  const gs = grupos();
  const aps = aportes();
  const dieron = aps.filter((a) => a.dio).length;
  const enUso = eqs.filter((e) => e.estado === "EN_USO").length;

  return (
    <Shell ruta="/">
      <h2>🎶 Grupo de Alabanza 2026</h2>
      <p className="mut">Resumen de lo que se lleva hasta el momento · IPUC 19, Maicao — Altos del Parrantial</p>
      <div className="stats">
        <div className="stat"><b>{act.length}</b><span>Activos</span></div>
        <div className="stat"><b>{fmtCOP(totalRecogido())}</b><span>Alcancía ({dieron} dieron)</span></div>
        <div className="stat"><b>{eqs.length}</b><span>Equipos ({enUso} en uso)</span></div>
        <div className="stat"><b>{gs.length}</b><span>Grupos de voces</span></div>
      </div>

      <div className="card">
        <div className="t">1. Personal activo ({act.length})</div>
        {act.map((i) => <div key={i.id} className="s">• {i.nombre} — {nombreGrupo(i.grupo_id)} · {i.rol}</div>)}
        <h3>Miembros no activos ({noAct.length})</h3>
        {noAct.map((i) => <div key={i.id} className="s">• {i.nombre} — {ep(i.estado)}</div>)}
      </div>

      <div className="card">
        <div className="t">2. Grupos de voces</div>
        {gs.map((g) => (
          <div key={g.id} className="s">• <b>{g.nombre}:</b> {ints.filter((i) => i.grupo_id === g.id).map((i) => i.nombre).join(", ") || "—"}</div>
        ))}
        <h3>Rotación</h3>
        {rot.map((r) => <div key={r.id} className="s">• {r.dia}: {nombreGrupo(r.grupo_id)}</div>)}
      </div>

      <div className="card">
        <div className="t">3. Equipos de sonido</div>
        {eqs.map((e) => <div key={e.id} className="s">• {e.nombre} — {eq(e.estado)} · {e.ubicacion}</div>)}
      </div>

      <div className="btnrow">
        <a className="btn" href="/api/reportes?kind=general">📄 PDF resumen general</a>
        <a className="btn sec" href="/api/reportes?kind=general&format=csv" style={{ display: "none" }}>CSV</a>
      </div>
      <p className="mut">Entregado por: Gerson Acosta · {FOOT()}</p>
    </Shell>
  );
}
function FOOT() { return "Generado por Gerson Acosta – Líder de Música"; }
