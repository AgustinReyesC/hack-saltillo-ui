import type { AppNotification } from '../../types'

/** Menú desplegable con la lista. Se pinta bajo la campana (CSS: position absolute). */
interface Props { items: AppNotification[]; onMarkRead: () => void }

export function NotificationPanel({ items, onMarkRead }: Props) {
  return (
    <div className="dropdown">
      <div className="row"><h2>Notificaciones</h2><button className="small" onClick={onMarkRead}>Marcar leídas</button></div>
      {items.length === 0 && <p className="muted">Sin eventos todavía.</p>}
      <ul className="notifs">
        {items.map((n) => (
          <li key={n.id} className={`notif ${n.level}`}>
            <strong>{n.title}</strong><span>{n.detail}</span>
            <small>{new Date(n.at).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}
