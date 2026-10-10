import type { ReactNode } from 'react'
import type { PartCondition, PartSummary } from '../../types'

/** Una columna = encabezado + cómo pintar una celda. Las tablas se arman con listas de estas. */
export interface Column { key: string; header: string; num?: boolean; mono?: boolean; render: (p: PartSummary) => ReactNode }

const pill = (cls: string, label: string) => <span className={`pill ${cls}`}>{label}</span>
const COND: Record<PartCondition, { label: string; cls: string }> = {
  new: { label: 'Nueva', cls: 'ok' }, functional: { label: 'Funcional', cls: 'ok' },
  defective: { label: 'Defectuosa', cls: 'warn' }, under_repair: { label: 'En reparación', cls: 'warn' }, scrapped: { label: 'Baja', cls: 'dark' },
}
/** Nivel de existencia (§10.1): servicio / nunca entró / comprometida / disponible. */
const level = (p: PartSummary) =>
  p.is_service ? pill('muted', 'Servicio') : p.on_hand === 0 ? pill('dark', 'Sin existencia')
  : p.available === 0 ? pill('warn', 'Comprometida') : pill('ok', 'Disponible')

/** Columnas COMUNES a ambas tablas (se escriben una sola vez). */
const base: Column[] = [
  { key: 'sku', header: 'SKU', mono: true, render: (p) => p.sku },
  { key: 'name', header: 'Pieza', render: (p) => p.name },
  { key: 'group', header: 'Grupo', render: (p) => p.group_name ?? '—' },
]
/** Inventario principal: existencias. */
export const mainColumns: Column[] = [...base,
  { key: 'on', header: 'En mano', num: true, render: (p) => p.on_hand },
  { key: 'res', header: 'Reservado', num: true, render: (p) => p.reserved },
  { key: 'av', header: 'Disponible', num: true, render: (p) => <b>{p.available}</b> },
  { key: 'lvl', header: 'Nivel', render: level },
]
/** Reparación / defectuosos: las dos columnas nuevas + reparabilidad. */
export const repairColumns: Column[] = [...base,
  { key: 'def', header: 'Clasificación del defecto', render: (p) => p.condition_code ? pill(COND[p.condition_code].cls, COND[p.condition_code].label) : '—' },
  { key: 'prob', header: 'Descripción del problema', render: (p) => p.status_note ?? <span className="muted">Sin descripción</span> },
  { key: 'qty', header: 'Cant.', num: true, render: (p) => p.on_hand },
  { key: 'rep', header: 'Reparable', render: (p) => p.condition_code === 'scrapped' ? pill('dark', 'No')
      : p.repair_tools_count > 0 ? pill('ok', `Sí (${p.repair_tools_count})`) : pill('warn', 'Sin herramienta') },
]
