import { Bell } from 'lucide-react'
/** Solo el ícono de campana con su numerito. No sabe si el panel está abierto: solo avisa con onClick. */
interface Props { count: number; onClick: () => void }

export function NotificationBell({ count, onClick }: Props) {
  return (
    <button className="bell" onClick={onClick} aria-label="Notificaciones">
      <Bell size={20} aria-hidden="true" />{count > 0 && <b className="badge">{count}</b>}
    </button>
  )
}
