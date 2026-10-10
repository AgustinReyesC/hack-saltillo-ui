import { useState } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationBell } from '../presentational/NotificationBell'
import { NotificationPanel } from '../presentational/NotificationPanel'
import { NotificationModal } from '../presentational/NotificationModal'

export function NotificationsContainer() {
  const { items, unread, markRead, markAllRead, dismiss } = useNotifications()
  const [open, setOpen] = useState(false)                      // ¿panel desplegable visible?
  const [selectedId, setSelectedId] = useState<string | null>(null) // notificación abierta en el modal (null = ninguna)

  // Guardamos solo el ID y buscamos el objeto en la lista viva: si se descarta, `selected` queda null y el modal desaparece solo.
  const selected = items.find((n) => n.id === selectedId) ?? null

  return (
    <div className="bell-wrap">
      <NotificationBell count={unread} onClick={() => setOpen(!open)} />
      {open && <NotificationPanel items={items} onMarkRead={markAllRead} onDismiss={dismiss}
        onOpen={(id) => { setSelectedId(id); markRead(id) }} /* abrir = ver detalle + marcar leída */ />}
      {selected && <NotificationModal notification={selected} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
