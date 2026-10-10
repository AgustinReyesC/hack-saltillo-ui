import type { MaterialLine, WorkOrderMaterials } from '../../types'
import { DataTable } from './DataTable'
import { materialColumns } from './columns'
import { Section } from './Section'

/** Las piezas de la orden separadas por estado. Una línea puede aparecer en varias (p. ej. 5 reservadas y 3 pendientes). */
export function WorkOrderTables({ data }: { data: WorkOrderMaterials }) {
  const key = (l: MaterialLine) => l.bom_line_id
  const reserved = data.items.filter((l) => l.reserved > 0)
  const issued = data.items.filter((l) => l.issued > 0)
  const pending = data.items.filter((l) => l.missing === null || l.missing > 0) // missing null = necesidad sin definir
  return (
    <div className="grid3">
      <Section title="Reservadas" tone="ok" count={reserved.length}><DataTable rows={reserved} columns={materialColumns('Reservado', (l) => l.reserved)} rowKey={key} empty="Nada reservado." /></Section>
      <Section title="Entregadas" count={issued.length}><DataTable rows={issued} columns={materialColumns('Entregado', (l) => l.issued)} rowKey={key} empty="Nada entregado aún." /></Section>
      <Section title="Pendientes (faltantes)" tone="warn" count={pending.length}><DataTable rows={pending} columns={materialColumns('Faltan', (l) => l.missing)} rowKey={key} empty="Sin faltantes" /></Section>
    </div>
  )
}
