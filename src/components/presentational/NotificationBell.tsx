/** Solo el ícono 🔔 con su numerito. No sabe si el panel está abierto: solo avisa con onClick. */
interface Props { count: number; onClick: () => void }

export function NotificationBell({ count, onClick }: Props) {
  return (
    <button className="bell" onClick={onClick} aria-label="Notificaciones">
      🔔{count > 0 && <b className="badge">{count}</b>}
    </button>
  )
}
