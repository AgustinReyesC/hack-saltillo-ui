import type { InventoryItem } from '../../types'

interface Props { items: InventoryItem[] }

/** Semáforo de existencia: 0 → Sin stock, ≤ mínimo → Bajo, resto → OK. */
function status(i: InventoryItem): { label: string; cls: string } {
  if (i.available === 0) return { label: 'Sin stock', cls: 'out' }
  if (i.available <= i.minStock) return { label: 'Bajo', cls: 'low' }
  return { label: 'OK', cls: 'ok' }
}

export function InventoryTable({ items }: Props) {
  if (items.length === 0) return <p className="muted">No se encontraron piezas.</p>
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>
          <th>SKU</th><th>Pieza</th><th>Categoría</th><th>Ubicación</th>
          <th>En mano</th><th>Reservado</th><th>Disponible</th><th>Estado</th>
        </tr></thead>
        <tbody>
          {items.map((i) => { const s = status(i); return (
            <tr key={i.id}>
              <td>{i.sku}</td><td>{i.name}</td><td>{i.category}</td><td>{i.location}</td>
              <td>{i.onHand}</td><td>{i.reserved}</td><td>{i.available}</td>
              <td><span className={`pill ${s.cls}`}>{s.label}</span></td>
            </tr>) })}
        </tbody>
      </table>
    </div>
  )
}
