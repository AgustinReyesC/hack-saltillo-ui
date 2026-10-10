import type { Column } from './columns'

/** Tabla genérica ÚNICA (<T> = tipo de fila). Densa, con filas clicables opcionales. Sin lógica de negocio. */
interface Props<T> { rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string | number; onRowClick?: (r: T) => void; selectedKey?: string | number | null; empty?: string }

export function DataTable<T>({ rows, columns, rowKey, onRowClick, selectedKey, empty = 'Sin registros.' }: Props<T>) {
  if (rows.length === 0) return <p className="muted pad">{empty}</p>
  return (
    <div className="table-wrap"><table>
      <thead><tr>{columns.map((c) => <th key={c.key} className={c.num ? 'num' : ''}>{c.header}</th>)}</tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={rowKey(r)} className={`${onRowClick ? 'click' : ''} ${selectedKey === rowKey(r) ? 'sel' : ''}`} onClick={() => onRowClick?.(r)}>
          {columns.map((c) => <td key={c.key} className={`${c.num ? 'num' : ''} ${c.mono ? 'mono' : ''}`}>{c.render(r)}</td>)}
        </tr>))}
      </tbody>
    </table></div>
  )
}
