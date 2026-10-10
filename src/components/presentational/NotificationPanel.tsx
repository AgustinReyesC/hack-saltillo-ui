import type { AppNotification } from '../../types'

/** Lista desplegable. Clic en la fila → onOpen (abre modal). 🗑 → onDismiss (la descarta). */
interface Props { items: AppNotification[]; onOpen: (id: string) => void; onDismiss: (id: string) => void; onMarkRead: () => void }

export function NotificationPanel({ items, onOpen, onDismiss, onMarkRead }: Props) {
  return (
    <div className="dropdown">
      <div className="row"><h2>Notificaciones</h2><button className="small" onClick={onMarkRead}>Marcar leídas</button></div>
      {items.length === 0 && <p className="muted">No hay notificaciones.</p>}
      <ul className="notifs">{items.map((n) => (
        <li key={n.id} className={`notif ${n.level} ${n.read ? '' : 'unread'}`}>
          <button className="notif-main" onClick={() => onOpen(n.id)}>
            <strong>{!n.read && <i className="dot" />}{n.title}</strong><span>{n.detail}</span>
            <small>{new Date(n.at).toLocaleString()}</small>
          </button>
          <button className="trash" onClick={() => onDismiss(n.id)} aria-label="Descartar notificación" title="Descartar">🗑</button>
        </li>))}
      </ul>
    </div>
  )
}
