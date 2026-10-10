import { ArrowLeftRight, ArrowUpFromLine, ListChecks } from 'lucide-react'
import type { FloorAction } from '../../../types'
/** Las 3 acciones principales, en botones enormes para dedo/guante. */
export const ActionPicker = ({ onPick }: { onPick: (a: FloorAction) => void }) => (
  <div className="actions3">
    <button className="big" onClick={() => onPick('issue')}><ArrowUpFromLine size={22} aria-hidden="true" /><span>Retirar</span></button>
    <button className="big" onClick={() => onPick('transfer')}><ArrowLeftRight size={22} aria-hidden="true" /><span>Transferir</span></button>
    <button className="big" onClick={() => onPick('count')}><ListChecks size={22} aria-hidden="true" /><span>Conteo cíclico</span></button>
  </div>
)
