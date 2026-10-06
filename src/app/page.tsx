import Shell from "@/components/Shell";
import { integrantes, equipos, totalRecogido, aportes, grupos, ajuste } from "@/lib/db";
import { eq, fmtCOP } from "@/lib/etiquetas";

export const dynamic = "force-dynamic";

export default function Inicio() {
  const ints = integrantes();
  const act = ints.filter((i) => i.estado === "ACTIVO").length;
  const eqs = equipos();
  const enUso = eqs.filter((e) => e.estado === "EN_USO").length;
  const alerta = eqs.filter((e) => e.estado === "DAÑADO" || e.estado === "MANTENIMIENTO").length;
  const sinUso = eqs.filter((e) => e.estado === "SIN_USO").length;
  const aps = aportes();
  const dieron = aps.filter((a) => a.dio).length;
  const porTipo: Record<string, number> = {};
  eqs.forEach((e) => { porTipo[e.tipo] = (porTipo[e.tipo] || 0) + 1; });

  return (
    <Shell ruta="/">
      <div className="hero">
        <h2>📦 Inventario IPUC 19</h2>
        <p>Maicao — Altos del Parrantial · {eqs.length} unidades registradas</p>
        <div className="hstats">
          <div><b>{eqs.length}</b><span>Unidades</span></div>
          <div className="dot-gold"><b>{enUso}</b><span>En uso</span></div>
          <div><b>{alerta}</b><span>En alerta</span></div>
        </div>
      </div>

      <div className="btnrow">
        <a className="btn sm gold" href="/equipos">🔊 Ver inventario</a>
        <a className="btn sec sm" href="/api/reportes?kind=equipos">📄 PDF inventario</a>
      </div>

      <div className="sect"><h3>Estado del inventario</h3><a href="/equipos">Ver todo →</a></div>
      <div className="stats">
        <div className="stat"><b>{enUso}</b><span>En uso</span></div>
        <div className="stat"><b>{sinUso}</b><span>Sin uso</span></div>
        <div className="stat"><b>{alerta}</b><span>Dañado / Mant.</span></div>
        <div className="stat"><b>{Object.keys(porTipo).length}</b><span>Tipos</span></div>
      </div>

      <div className="card accent">
        <div className="t">📋 Por tipo</div>
        {Object.entries(porTipo).map(([t, n]) => (
          <div key={t} className="s">• <b>{t}:</b> {n} {n === 1 ? "unidad" : "unidades"}</div>
        ))}
        {eqs.filter((e) => e.estado !== "EN_USO").slice(0, 5).map((e) => (
          <div key={e.id} className="s">⚠️ {e.nombre} — {eq(e.estado)} · {e.ubicacion}</div>
        ))}
      </div>

      <div className="sect"><h3>Alabanza</h3><a href="/grupos">Abrir →</a></div>
      <div className="stats">
        <div className="stat"><b>{act}</b><span>Activos</span></div>
        <div className="stat"><b>{grupos().length}</b><span>Grupos</span></div>
        <div className="stat"><b>{fmtCOP(totalRecogido())}</b><span>Alcancía</span></div>
        <div className="stat"><b>{dieron}</b><span>Dieron</span></div>
      </div>
      <div className="btnrow">
        <a className="btn sm" href="/api/reportes?kind=general">📄 PDF resumen general</a>
      </div>

      <p className="mut">Generado por {ajuste("firma_nombre") ?? "Gerson Acosta"} – {firmaCargo()}</p>
    </Shell>
  );
}
function firmaCargo() {
  const cargo = ajuste("firma_cargo") ?? "Líder de Alabanza";
  return cargo === "Líder de Música" ? "Líder de Alabanza" : cargo;
}
