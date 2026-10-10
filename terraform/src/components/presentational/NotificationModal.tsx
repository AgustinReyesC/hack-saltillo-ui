import { X } from 'lucide-react'
import { Fragment } from 'react'
import type { AppAlert } from '../../types'
/** Ventana centrada con el detalle de la alerta + atajo a la pantalla que la resuelve. Cierra con la X o clic en el fondo. */
interface Props { alert: AppAlert; onClose: () => void; onGo: () => void }
export function NotificationModal({ alert: a, onClose, onGo }: Props) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className={`modal ${a.level === 'warning' ? 'warning' : ''}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{a.title}</h2><button className="x" onClick={onClose} aria-label="Cerrar"><X size={18} aria-hidden="true" /></button></div>
        <dl>{a.fields.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}</dl>
        <button className="big" onClick={onGo}>{a.actionLabel}</button>
      </div>
    </div>
  )
}
