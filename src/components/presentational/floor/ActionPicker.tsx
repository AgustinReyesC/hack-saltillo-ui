import type { FloorAction } from '../../../types'
/** Las 3 acciones principales, en botones enormes para dedo/guante. */
export const ActionPicker = ({ onPick }: { onPick: (a: FloorAction) => void }) => (
  <div className="actions3">
    <button className="big" onClick={() => onPick('issue')}>📤 Retirar</button>
    <button className="big" onClick={() => onPick('transfer')}>🔀 Transferir</button>
    <button className="big" onClick={() => onPick('count')}>🔢 Conteo cíclico</button>
  </div>
)
