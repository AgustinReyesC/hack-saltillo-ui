import { useState } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import { NotificationBell } from '../presentational/NotificationBell'
import { NotificationPanel } from '../presentational/NotificationPanel'

/** Dueño de su propio estado: el App no necesita saber si el panel está abierto. */
export function NotificationsContainer() {
  const { items, unread, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false) // useState: false = oculto (valor por defecto)
  return (
    <div className="bell-wrap">
      {/* !open invierte el valor: clic abre, otro clic cierra */}
      <NotificationBell count={unread} onClick={() => setOpen(!open)} />
      {/* Renderizado condicional: el panel SOLO existe en pantalla si open es true */}
      {open && <NotificationPanel items={items} onMarkRead={markAllRead} />}
    </div>
  )
}
