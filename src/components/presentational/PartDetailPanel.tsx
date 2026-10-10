import type { Availability, PartSummary } from '../../types'

/** Panel lateral de detalle (inspirado en "Product Detail"): KPIs + datos + existencia por ubicación. */
interface Props { part: PartSummary; availability: Availability | null; loading: boolean; error: string | null; onClose: () => void }

export function PartDetailPanel({ part, availability: a, loading, error, onClose }: Props) {
  return (
    <aside className="drawer">
      <div className="drawer-head"><div><small className="mono">{part.sku}</small><h2>{part.name}</h2></div><button className="x" onClick={onClose}>✕</button></div>
      <div className="kpis">
        <div><span>En mano</span><b>{a?.on_hand ?? part.on_hand}</b></div>
        <div><span>Reservado</span><b>{a?.reserved ?? part.reserved}</b></div>
        <div><span>Disponible</span><b>{a?.available ?? part.available}</b></div>
      </div>
      <h3>Información básica</h3>
      <dl><dt>ID</dt><dd>{part.part_id}</dd><dt>Grupo</dt><dd>{part.group_name ?? '—'}</dd>
        <dt>Familia</dt><dd>{part.family ?? '—'}</dd><dt>Herramientas de reparación</dt><dd>{part.repair_tools_count}</dd>
        {part.status_note && <><dt>Problema</dt><dd>{part.status_note}</dd></>}</dl>
      <h3>Existencia por ubicación</h3>
      {loading && <p className="muted">Cargando…</p>}{error && <p className="error">⚠ {error}</p>}
      {a && (a.locations.length === 0 ? <p className="muted">Nunca ha entrado al almacén.</p> : (
        <table><thead><tr><th>Ubicación</th><th className="num">En mano</th><th className="num">Disponible</th></tr></thead>
          <tbody>{a.locations.map((l) => <tr key={l.location_id}><td className="mono">{l.code}</td><td className="num">{l.on_hand}</td><td className="num">{l.available}</td></tr>)}</tbody></table>))}
    </aside>
  )
}
