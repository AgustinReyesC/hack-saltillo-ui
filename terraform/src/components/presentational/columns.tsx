import type { ReactNode } from 'react'
import type { LedgerEntry, MaterialLine, MovementType, OpenShortage, PartSummary, ReorderSuggestion, StockRow, UnmatchedReceipt } from '../../types'
import { fmtDate } from '../../utils/text'

/** Una columna = encabezado + cómo pintar la celda. Cada tabla es una lista de estas (una sola DataTable para todo). */
export interface Column<T> { key: string; header: string; num?: boolean; mono?: boolean; render: (row: T) => ReactNode }
export const pill = (cls: 'ok' | 'warn' | 'dark' | 'muted', label: string) => <span className={`pill ${cls}`}>{label}</span>

export const stockColumns: Column<StockRow>[] = [
  { key: 'sku', header: 'SKU', mono: true, render: (r) => r.sku }, { key: 'n', header: 'Pieza', render: (r) => r.name },
  { key: 'loc', header: 'Ubicación', mono: true, render: (r) => r.location_code },
  { key: 'oh', header: 'En mano', num: true, render: (r) => r.on_hand }, { key: 'av', header: 'Disponible', num: true, render: (r) => <b>{r.available}</b> },
]
export const shortageColumns: Column<OpenShortage>[] = [
  { key: 'o', header: 'Orden', mono: true, render: (s) => s.work_order_code }, { key: 'n', header: 'Pieza', render: (s) => s.name },
  { key: 'm', header: 'Faltan', num: true, render: (s) => <b>{s.missing_quantity ?? '?'}</b> }, { key: 'd', header: 'Abierto', render: (s) => fmtDate(s.opened_at) },
]
export const reorderColumns: Column<ReorderSuggestion>[] = [
  { key: 'sku', header: 'SKU', mono: true, render: (r) => r.sku }, { key: 'n', header: 'Pieza', render: (r) => r.name },
  { key: 'q', header: 'Comprar', num: true, render: (r) => <b>{r.suggested_quantity}</b> }, { key: 'w', header: 'Órdenes', render: (r) => r.work_order_ids.join(', ') },
]
export const unmatchedColumns: Column<UnmatchedReceipt>[] = [
  { key: 'pl', header: 'Línea compra', mono: true, render: (r) => r.purchase_line_id }, { key: 'pn', header: 'N° de parte', mono: true, render: (r) => r.part_number },
  { key: 'd', header: 'Descripción', render: (r) => r.description || '—' }, { key: 'q', header: 'Cant.', num: true, render: (r) => r.quantity },
  { key: 'p', header: 'Precio unit.', num: true, render: (r) => r.unit_price },
]
export const catalogColumns: Column<PartSummary>[] = [
  { key: 'sku', header: 'SKU', mono: true, render: (p) => p.sku }, { key: 'n', header: 'Pieza', render: (p) => p.name }, { key: 'g', header: 'Grupo', render: (p) => p.group_name ?? '—' },
]
const TYPE: Record<MovementType, string> = { receipt: 'Entrada', issue: 'Salida', transfer_out: 'Transf. (sale)', transfer_in: 'Transf. (entra)', adjustment: 'Ajuste' }
/** Kardex. `codeOf` traduce location_id → "U-101" (se recibe porque las ubicaciones vienen del contenedor). */
export const ledgerColumns = (codeOf: (id: number) => string): Column<LedgerEntry>[] => [
  { key: 'd', header: 'Fecha', render: (e) => fmtDate(e.occurred_at) }, { key: 't', header: 'Tipo', render: (e) => TYPE[e.type] },
  { key: 'l', header: 'Ubicación', mono: true, render: (e) => codeOf(e.location_id) },
  { key: 'q', header: 'Cantidad', num: true, render: (e) => <b className={e.quantity < 0 ? 'neg' : 'pos'}>{e.quantity > 0 ? `+${e.quantity}` : e.quantity}</b> },
  { key: 'b', header: 'Saldo', num: true, render: (e) => <b>{e.balance}</b> }, { key: 'r', header: 'Referencia', mono: true, render: (e) => e.reference ?? '—' },
]
/** Tablas de orden de trabajo: misma forma, cambia qué cantidad se muestra (reservada / entregada / faltante). */
export const materialColumns = (label: string, pick: (l: MaterialLine) => number | null): Column<MaterialLine>[] => [
  { key: 'n', header: 'Pieza', render: (l) => l.name }, { key: 'rq', header: 'Requerido', num: true, render: (l) => l.required ?? '?' },
  { key: 'x', header: label, num: true, render: (l) => <b>{pick(l) ?? '?'}</b> },
]
