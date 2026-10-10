import type { PartSummary } from '../../types'
import type { Column } from './partColumns'

/** Tabla ÚNICA y reutilizable: lo que cambia entre áreas son las `columns`, no el componente. */
interface Props { parts: PartSummary[]; columns: Column[]; selectedId: number | null; onSelect: (id: number) => void }

export function PartsTable({ parts, columns, selectedId, onSelect }: Props) {
  if (parts.length === 0) return <p className="muted pad">Sin resultados.</p>
  return (
    <div className="table-wrap"><table>
      <thead><tr>{columns.map((c) => <th key={c.key} className={c.num ? 'num' : ''}>{c.header}</th>)}</tr></thead>
      <tbody>{parts.map((p) => (
        <tr key={p.part_id} className={p.part_id === selectedId ? 'sel' : ''} onClick={() => onSelect(p.part_id)}>
          {columns.map((c) => <td key={c.key} className={`${c.num ? 'num' : ''} ${c.mono ? 'mono' : ''}`}>{c.render(p)}</td>)}
        </tr>))}
      </tbody>
    </table></div>
  )
}
