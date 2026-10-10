import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAlerts } from '../../hooks/useAlerts'
import { NotificationBell } from '../presentational/NotificationBell'
import { NotificationPanel } from '../presentational/NotificationPanel'
import { NotificationModal } from '../presentational/NotificationModal'

export function NotificationsContainer() {
  const items = useAlerts()                                       // alertas calculadas del estado del servidor
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)                         // panel desplegable
  const [selectedId, setSelectedId] = useState<string | null>(null) // alerta abierta en el modal
  const selected = items.find((n) => n.id === selectedId) ?? null // si se resuelve mientras está abierta, el modal se cierra solo
  return (
    <div className="bell-wrap">
      <NotificationBell count={items.length} onClick={() => setOpen(!open)} />
      {open && <NotificationPanel items={items} onOpen={setSelectedId} />}
      {selected && <NotificationModal alert={selected} onClose={() => setSelectedId(null)}
        onGo={() => { navigate(selected.to); setSelectedId(null); setOpen(false) }} />}
    </div>
  )
}
