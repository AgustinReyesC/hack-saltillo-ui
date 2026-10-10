import type { AppAlert } from '../../types'
import { fmtDate } from '../../utils/text'

/** Centro de alertas. A propósito NO hay botón de descartar: cada alerta desaparece cuando se resuelve en el servidor. */
interface Props { items: AppAlert[]; onOpen: (id: string) => void }
export function NotificationPanel({ items, onOpen }: Props) {
  return (
    <div className="dropdown">
      <div className="row"><h2>Alertas</h2><span className="muted">{items.length} activas</span></div>
      {items.length === 0 && <p className="muted">Todo surtido y relacionado ✔</p>}
      <ul className="notifs">{items.map((n) => (
        <li key={n.id} className={`notif ${n.level === 'warning' ? 'warning' : 'info'}`}>
          <button className="notif-main" onClick={() => onOpen(n.id)}><strong>{n.title}</strong><span>{n.detail}</span><small>{fmtDate(n.at)}</small></button>
        </li>))}
      </ul>
    </div>
  )
}
