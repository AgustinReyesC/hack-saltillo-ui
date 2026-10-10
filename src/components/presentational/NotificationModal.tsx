import { Fragment } from 'react'
import type { AppNotification } from '../../types'

/** Ventana emergente centrada con TODO el detalle del evento. Se cierra con la ✕ o clic en el fondo. */
interface Props { notification: AppNotification; onClose: () => void }
const show = (v: unknown) => (v === null || v === undefined ? '—' : Array.isArray(v) ? v.join(', ') : String(v))

export function NotificationModal({ notification: n, onClose }: Props) {
  return (
    <div className="backdrop" onClick={onClose}>
      {/* stopPropagation: un clic DENTRO de la ventana no debe cerrarla */}
      <div className={`modal ${n.level}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{n.title}</h2><button className="x" onClick={onClose} aria-label="Cerrar">✕</button></div>
        <dl>
          <dt>Tipo</dt><dd className="mono">{n.event_type}</dd>
          <dt>Clave</dt><dd className="mono">{n.key}</dd>
          <dt>Fecha</dt><dd>{new Date(n.at).toLocaleString()}</dd>
          <dt>ID de evento</dt><dd className="mono">{n.id}</dd>
        </dl>
        <h3>Datos del evento</h3>
        <dl>{Object.entries(n.data).map(([k, v]) => <Fragment key={k}><dt className="mono">{k}</dt><dd>{show(v)}</dd></Fragment>)}</dl>
      </div>
    </div>
  )
}
