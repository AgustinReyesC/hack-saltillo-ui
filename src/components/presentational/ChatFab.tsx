/** Botón flotante (FAB) del chatbot, abajo a la derecha. Cambia de 💬 a ✕ según `open`. */
interface Props { open: boolean; onClick: () => void }

export const ChatFab = ({ open, onClick }: Props) => (
  <button className="fab" onClick={onClick} aria-label={open ? 'Cerrar chat' : 'Abrir chat'}>{open ? '✕' : '💬'}</button>
)
